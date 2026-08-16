import { describe, expect, it } from 'vitest'
import {
  validateIosProjectMetadata,
  validateXcodeProjectListing,
} from './ios-project-smoke'

const appConfig = JSON.stringify({
  expo: {
    name: 'CharTalk',
    newArchEnabled: true,
    ios: {
      bundleIdentifier: 'app.chartalk.reader',
      deploymentTarget: '17.0',
      supportsTablet: true,
    },
  },
})

const project = `
PBXNativeTarget /* CharTalk */
PRODUCT_BUNDLE_IDENTIFIER = app.chartalk.reader;
IPHONEOS_DEPLOYMENT_TARGET = 17.0;
TARGETED_DEVICE_FAMILY = "1,2";
ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
Release
`

const podfileProperties = JSON.stringify({
  'ios.deploymentTarget': '17.0',
})

const plist = `
<key>CFBundleURLSchemes</key>
<string>chartalk</string>
<string>app.chartalk.reader</string>
<key>UIRequiredDeviceCapabilities</key>
<string>arm64</string>
<string>UIInterfaceOrientationPortrait</string>
`

describe('iOS native project smoke metadata', () => {
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
        .replace('app.chartalk.reader', 'app.chartalk.other')
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
        .replace('<string>chartalk</string>', '')
        .replace('<string>app.chartalk.reader</string>', ''),
      podfileProperties,
    })

    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'expo.ios.supportsTablet must be true',
        'Info.plist must include the chartalk URL scheme',
        'Info.plist must include the app bundle URL scheme',
      ]),
    )
  })

  it('checks the Xcode listing independently of metadata validation', () => {
    expect(validateXcodeProjectListing('Targets:\n CharTalk\nRelease')).toEqual(
      [],
    )
    expect(validateXcodeProjectListing('Targets:\n OtherApp')).toEqual([
      'target/configuration not listed by xcodebuild',
    ])
  })
})
