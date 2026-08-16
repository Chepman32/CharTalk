import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

type JsonRecord = Record<string, unknown>

export interface IosProjectMetadataInput {
  appConfig: string
  podfileProperties: string
  project: string
  plist: string
}

export interface IosProjectMetadataResult {
  ok: boolean
  errors: string[]
}

export interface IosProjectSmokeOptions {
  requireXcode?: boolean
}

const moduleDirectory = dirname(fileURLToPath(import.meta.url))

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function hasProjectAssignment(
  project: string,
  key: string,
  value: string,
): boolean {
  return (
    project.includes(`${key} = ${value};`) ||
    project.includes(`${key} = "${value}";`)
  )
}

/**
 * Checks the generated iOS project against the Expo contract without invoking
 * Xcode. Keeping this pure makes it safe to run in CI and unit tests on hosts
 * that do not have Apple tooling installed.
 */
export function validateIosProjectMetadata(
  input: IosProjectMetadataInput,
): IosProjectMetadataResult {
  const errors: string[] = []
  let parsedConfig: unknown
  let parsedPodfileProperties: unknown

  try {
    parsedConfig = JSON.parse(input.appConfig) as unknown
  } catch {
    return { ok: false, errors: ['app.json must be valid JSON'] }
  }

  try {
    parsedPodfileProperties = JSON.parse(input.podfileProperties) as unknown
  } catch {
    return { ok: false, errors: ['Podfile.properties.json must be valid JSON'] }
  }

  const expo =
    isRecord(parsedConfig) && isRecord(parsedConfig.expo)
      ? parsedConfig.expo
      : undefined
  const ios = expo && isRecord(expo.ios) ? expo.ios : undefined

  if (!expo || !ios) {
    errors.push('app.json must define expo.ios')
  }

  const bundleIdentifier = ios?.bundleIdentifier
  const deploymentTarget = ios?.deploymentTarget

  if (!isNonEmptyString(bundleIdentifier)) {
    errors.push('expo.ios.bundleIdentifier must be a non-empty string')
  }
  if (!isNonEmptyString(deploymentTarget)) {
    errors.push('expo.ios.deploymentTarget must be a non-empty string')
  }
  if (expo?.newArchEnabled !== true) {
    errors.push('expo.newArchEnabled must be true')
  }
  if (ios?.supportsTablet !== true) {
    errors.push('expo.ios.supportsTablet must be true')
  }

  if (
    typeof bundleIdentifier === 'string' &&
    !hasProjectAssignment(
      input.project,
      'PRODUCT_BUNDLE_IDENTIFIER',
      bundleIdentifier,
    )
  ) {
    errors.push(
      'project bundle identifier must match expo.ios.bundleIdentifier',
    )
  }
  if (
    typeof deploymentTarget === 'string' &&
    !hasProjectAssignment(
      input.project,
      'IPHONEOS_DEPLOYMENT_TARGET',
      deploymentTarget,
    )
  ) {
    errors.push(
      'project deployment target must match expo.ios.deploymentTarget',
    )
  }
  if (
    typeof deploymentTarget === 'string' &&
    (!isRecord(parsedPodfileProperties) ||
      parsedPodfileProperties['ios.deploymentTarget'] !== deploymentTarget)
  ) {
    errors.push(
      'Podfile deployment target must match expo.ios.deploymentTarget',
    )
  }
  if (
    !input.project.includes('PBXNativeTarget') ||
    !input.project.includes('CharTalk')
  ) {
    errors.push('project must contain the CharTalk native target')
  }
  if (!input.project.includes('TARGETED_DEVICE_FAMILY = "1,2";')) {
    errors.push('project must support iPhone and iPad device families')
  }
  if (
    !input.project.includes('ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;')
  ) {
    errors.push('project must configure the AppIcon asset catalog')
  }
  if (!input.project.includes('Release')) {
    errors.push('project must include a Release configuration')
  }
  if (!input.plist.includes('<string>arm64</string>')) {
    errors.push('Info.plist must require arm64')
  }
  if (!input.plist.includes('<string>chartalk</string>')) {
    errors.push('Info.plist must include the chartalk URL scheme')
  }
  if (
    typeof bundleIdentifier === 'string' &&
    !input.plist.includes(`<string>${bundleIdentifier}</string>`)
  ) {
    errors.push('Info.plist must include the app bundle URL scheme')
  }
  if (!input.plist.includes('UIInterfaceOrientationPortrait')) {
    errors.push('Info.plist must include portrait orientation')
  }

  return { ok: errors.length === 0, errors }
}

export function validateXcodeProjectListing(output: string): string[] {
  return output.includes('CharTalk') && output.includes('Release')
    ? []
    : ['target/configuration not listed by xcodebuild']
}

export function runIosProjectSmoke(
  projectRoot = resolve(moduleDirectory, '..'),
  options: IosProjectSmokeOptions = {},
): number {
  const iosRoot = resolve(projectRoot, 'apps/mobile/ios')
  const appConfigPath = resolve(projectRoot, 'apps/mobile/app.json')
  const projectPath = resolve(iosRoot, 'CharTalk.xcodeproj')
  const pbxprojPath = resolve(projectPath, 'project.pbxproj')
  const plistPath = resolve(iosRoot, 'CharTalk/Info.plist')
  const podfilePropertiesPath = resolve(iosRoot, 'Podfile.properties.json')

  const requiredFiles = [
    appConfigPath,
    projectPath,
    pbxprojPath,
    plistPath,
    podfilePropertiesPath,
  ]
  const missingFiles = requiredFiles.filter(filePath => !existsSync(filePath))
  if (missingFiles.length > 0) {
    console.error('iOS native project smoke failed: missing files')
    for (const filePath of missingFiles) console.error(`- ${filePath}`)
    return 1
  }

  const result = validateIosProjectMetadata({
    appConfig: readFileSync(appConfigPath, 'utf8'),
    podfileProperties: readFileSync(podfilePropertiesPath, 'utf8'),
    project: readFileSync(pbxprojPath, 'utf8'),
    plist: readFileSync(plistPath, 'utf8'),
  })
  if (!result.ok) {
    console.error('iOS native project smoke failed: metadata drift')
    for (const error of result.errors) console.error(`- ${error}`)
    return 1
  }

  const xcode = spawnSync('xcodebuild', ['-list', '-project', projectPath], {
    cwd: iosRoot,
    encoding: 'utf8',
  })
  if (xcode.error) {
    if (options.requireXcode) {
      console.error(`iOS native project smoke failed: ${xcode.error.message}`)
      return 1
    }
    console.warn(
      `iOS native project metadata passed; xcodebuild unavailable (${xcode.error.message}).`,
    )
    return 0
  }
  if (xcode.status !== 0) {
    console.error('iOS native project smoke failed: xcodebuild -list')
    if (xcode.stderr) console.error(xcode.stderr.trim())
    return 1
  }
  const listingErrors = validateXcodeProjectListing(xcode.stdout)
  if (listingErrors.length > 0) {
    console.error(
      `iOS native project smoke failed: ${listingErrors.join(', ')}`,
    )
    return 1
  }

  console.log(
    'iOS native project smoke passed: CharTalk target, Release configuration, and Expo metadata are aligned.',
  )
  return 0
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  process.exitCode = runIosProjectSmoke(undefined, {
    requireXcode: process.argv.includes('--require-xcode'),
  })
}
