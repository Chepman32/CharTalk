import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  validateIosProjectMetadata,
  validateXcodeProjectListing,
} from './ios-project-smoke'

const appConfig = JSON.stringify({
  expo: {
    name: 'Razvilka',
    newArchEnabled: true,
    ios: {
      bundleIdentifier: 'app.razvilka.reader',
      deploymentTarget: '17.0',
      supportsTablet: true,
    },
  },
})

const project = `
PBXNativeTarget /* Razvilka */
PRODUCT_BUNDLE_IDENTIFIER = app.razvilka.reader;
IPHONEOS_DEPLOYMENT_TARGET = 17.0;
TARGETED_DEVICE_FAMILY = "1,2";
ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
HERMES_CLI_PATH = "$(SRCROOT)/../../../node_modules/hermes-compiler/hermesc/osx-bin/hermesc";
REACT_NATIVE_XCODE_SCRIPT="$PROJECT_ROOT/node_modules/react-native/scripts/react-native-xcode.sh"
"$REACT_NATIVE_XCODE_SCRIPT"
Release
`

const podfileProperties = JSON.stringify({
  'ios.deploymentTarget': '17.0',
})

const plist = `
<key>CFBundleURLSchemes</key>
<string>razvilka</string>
<string>app.razvilka.reader</string>
<key>UIRequiredDeviceCapabilities</key>
<string>arm64</string>
<string>UIInterfaceOrientationPortrait</string>
`

describe('iOS native project smoke metadata', () => {
  it('keeps the Expo Constants script path quoted inside nested bash', () => {
    const dependencyPatch = readFileSync(
      resolve(import.meta.dirname, '../patches/expo-constants+57.0.13.patch'),
      'utf8',
    )
    const addedScriptLine = dependencyPatch
      .split('\n')
      .find(line => line.startsWith('+    :script =>'))
    const addedBasenameLine = dependencyPatch
      .split('\n')
      .find(line => line.startsWith('+PROJECT_DIR_BASENAME='))

    expect(addedScriptLine).toBe(
      '+    :script => "bash -l -c \\"\\\\\\"#{env_vars}$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\\\\\"\\"",',
    )
    expect(addedBasenameLine).toBe(
      '+PROJECT_DIR_BASENAME=$(basename "$PROJECT_DIR")',
    )
  })

  it('accepts a CNG project matching the Expo contract', () => {
    expect(
      validateIosProjectMetadata({
        appConfig,
        project,
        plist,
        podfileProperties,
      }),
    ).toEqual({ ok: true, errors: [] })
  })

  it('rejects a project with drifted bundle identity or deployment target', () => {
    const result = validateIosProjectMetadata({
      appConfig,
      project: project
        .replace('app.razvilka.reader', 'app.razvilka.other')
        .replace('17.0', '16.4'),
      plist,
      podfileProperties: podfileProperties.replace('17.0', '16.4'),
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'project bundle identifier must match expo.ios.bundleIdentifier',
        'project deployment target must match expo.ios.deploymentTarget',
        'Podfile deployment target must match expo.ios.deploymentTarget',
      ]),
    )
  })

  it('rejects missing New Architecture and accessibility-safe native capabilities', () => {
    const result = validateIosProjectMetadata({
      appConfig: appConfig.replace(
        '"newArchEnabled":true',
        '"newArchEnabled":false',
      ),
      project: project.replace('TARGETED_DEVICE_FAMILY = "1,2";', ''),
      plist: plist
        .replace('<string>arm64</string>', '')
        .replace('<string>UIInterfaceOrientationPortrait</string>', ''),
      podfileProperties,
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'expo.newArchEnabled must be true',
        'project must support iPhone and iPad device families',
        'Info.plist must require arm64',
        'Info.plist must include portrait orientation',
      ]),
    )
  })

  it('rejects a project that drops tablet support or the deep-link scheme', () => {
    const result = validateIosProjectMetadata({
      appConfig: appConfig.replace(
        '"supportsTablet":true',
        '"supportsTablet":false',
      ),
      project,
      plist: plist
        .replace('<string>razvilka</string>', '')
        .replace('<string>app.razvilka.reader</string>', ''),
      podfileProperties,
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'expo.ios.supportsTablet must be true',
        'Info.plist must include the razvilka URL scheme',
        'Info.plist must include the app bundle URL scheme',
      ]),
    )
  })

  it('checks the Xcode listing independently of metadata validation', () => {
    expect(validateXcodeProjectListing('Targets:\n Razvilka\nRelease')).toEqual(
      [],
    )
    expect(validateXcodeProjectListing('Targets:\n OtherApp')).toEqual([
      'target/configuration not listed by xcodebuild',
    ])
  })

  it('rejects an unquoted React Native bundle-script path', () => {
    const result = validateIosProjectMetadata({
      appConfig,
      project: project
        .replace(/REACT_NATIVE_XCODE_SCRIPT=.*\n/, '')
        .replace('"$REACT_NATIVE_XCODE_SCRIPT"\n', ''),
      plist,
      podfileProperties,
    })

    expect(result.errors).toContain(
      'React Native bundle script must invoke its resolved path safely',
    )
  })

  it('rejects a Hermes compiler path that is not derived from the Xcode source root', () => {
    const result = validateIosProjectMetadata({
      appConfig,
      project: project.replace(
        'HERMES_CLI_PATH = "$(SRCROOT)/../../../node_modules/hermes-compiler/hermesc/osx-bin/hermesc";\n',
        '',
      ),
      plist,
      podfileProperties,
    })

    expect(result.errors).toContain(
      'Hermes compiler path must be derived safely from the project root',
    )
  })
})
