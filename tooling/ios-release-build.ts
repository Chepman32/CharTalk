import { existsSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

export interface IosReleaseBuildPlan {
  workspacePath: string
  args: string[]
}

export interface IosReleaseBuildOptions {
  derivedDataPath?: string
  installPods?: boolean
}

const moduleDirectory = dirname(fileURLToPath(import.meta.url))

export function createIosReleaseBuildPlan(
  iosRoot: string,
  derivedDataPath: string,
): IosReleaseBuildPlan {
  const workspacePath = resolve(iosRoot, 'CharTalk.xcworkspace')
  return {
    workspacePath,
    args: [
      '-workspace',
      workspacePath,
      '-scheme',
      'CharTalk',
      '-configuration',
      'Release',
      '-sdk',
      'iphonesimulator',
      '-destination',
      'generic/platform=iOS Simulator',
      '-derivedDataPath',
      derivedDataPath,
      '-quiet',
      'CODE_SIGNING_ALLOWED=NO',
      'build',
    ],
  }
}

export function runIosReleaseBuild(
  projectRoot = resolve(moduleDirectory, '..'),
  options: IosReleaseBuildOptions = {},
): number {
  const iosRoot = resolve(projectRoot, 'apps/mobile/ios')
  const podfileLockPath = resolve(iosRoot, 'Podfile.lock')

  if (options.installPods) {
    const pod = spawnSync(
      'pod',
      existsSync(podfileLockPath) ? ['install', '--deployment'] : ['install'],
      { cwd: iosRoot, stdio: 'inherit' },
    )
    if (pod.error) {
      console.error(`iOS Release build failed: ${pod.error.message}`)
      return 1
    }
    if (pod.status !== 0) {
      console.error('iOS Release build failed: CocoaPods install')
      return pod.status ?? 1
    }
  }

  const derivedDataPath =
    options.derivedDataPath ??
    mkdtempSync(join(tmpdir(), 'chartalk-ios-release-'))
  const plan = createIosReleaseBuildPlan(iosRoot, derivedDataPath)
  const missingFiles = [plan.workspacePath, podfileLockPath].filter(
    filePath => !existsSync(filePath),
  )
  if (missingFiles.length > 0) {
    console.error('iOS Release build failed: CocoaPods workspace is missing')
    for (const filePath of missingFiles) console.error(`- ${filePath}`)
    console.error(
      'Run `cd apps/mobile/ios && pod install` before the Release build.',
    )
    return 1
  }

  const xcode = spawnSync('xcodebuild', plan.args, {
    cwd: iosRoot,
    stdio: 'inherit',
  })
  if (xcode.error) {
    console.error(`iOS Release build failed: ${xcode.error.message}`)
    return 1
  }
  if (xcode.status !== 0) {
    console.error(
      'iOS Release build failed: xcodebuild returned a non-zero exit',
    )
    return xcode.status ?? 1
  }

  console.log(
    `iOS Release build passed: unsigned Simulator artifact compiled at ${derivedDataPath}.`,
  )
  return 0
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  const derivedDataArgument = process.argv.find(argument =>
    argument.startsWith('--derived-data='),
  )
  process.exitCode = runIosReleaseBuild(undefined, {
    installPods: process.argv.includes('--install-pods'),
    derivedDataPath: derivedDataArgument?.slice('--derived-data='.length),
  })
}
