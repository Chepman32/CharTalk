import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mobileRoot = resolve(repositoryRoot, 'apps/mobile')

const readText = (relativePath: string) =>
  readFileSync(resolve(mobileRoot, relativePath), 'utf8')

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readText(relativePath)) as T

type MobilePackage = {
  main?: string
  scripts?: Record<string, string>
  devDependencies?: Record<string, string>
}

type RootPackage = {
  scripts?: Record<string, string>
}

describe('React Native Community CLI mobile contract', () => {
  it('exposes Android commands when invoked from the repository root', () => {
    const result = spawnSync(
      process.execPath,
      [
        resolve(repositoryRoot, 'node_modules', 'react-native', 'cli.js'),
        'run-android',
        '--help',
      ],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
      },
    )

    expect(result.status).toBe(0)
    expect(result.stdout).toContain(
      'builds your app and starts it on a connected Android emulator or device',
    )
  })

  it('forwards root native commands to the mobile workspace', () => {
    const rootPackage = JSON.parse(
      readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'),
    ) as RootPackage

    expect(rootPackage.scripts).toMatchObject({
      start: 'npm run start --workspace @razvilka/mobile --',
      android: 'npm run android --workspace @razvilka/mobile --',
      ios: 'npm run ios --workspace @razvilka/mobile --',
    })
  })

  it('uses the Community CLI for development and native builds', () => {
    const mobilePackage = readJson<MobilePackage>('package.json')

    expect(mobilePackage.main).toBe('index.js')
    expect(mobilePackage.scripts).toMatchObject({
      start: 'react-native start',
      android: 'react-native run-android',
      ios: 'react-native run-ios',
    })
    expect(mobilePackage.devDependencies?.['@react-native-community/cli']).toBe(
      '20.2.0',
    )
    expect(mobilePackage.devDependencies?.['@react-native/metro-config']).toBe(
      '0.86.2',
    )
  })

  it('registers the existing Expo Router application through a React Native entry file', () => {
    const entryFile = resolve(mobileRoot, 'index.js')

    expect(existsSync(entryFile)).toBe(true)
    expect(readFileSync(entryFile, 'utf8')).toContain(
      "import 'expo-router/entry'",
    )
  })

  it('uses a Community CLI-compatible Metro configuration with Expo Router support', () => {
    const metroConfig = resolve(mobileRoot, 'metro.config.cjs')

    expect(existsSync(metroConfig)).toBe(true)
    expect(readFileSync(metroConfig, 'utf8')).toContain(
      "require('expo/metro-config')",
    )
    expect(readFileSync(metroConfig, 'utf8')).toContain(
      "require('@react-native/metro-config')",
    )
    expect(readFileSync(metroConfig, 'utf8')).toContain(
      "moduleName.startsWith('@/')",
    )
    expect(readFileSync(metroConfig, 'utf8')).toContain(
      "path.resolve(projectRoot, 'src', moduleName.slice(2))",
    )
    expect(readText('.watchmanconfig').trim()).toBe('{}')
  })

  it('does not delegate Android or iOS bundles to Expo CLI', () => {
    const androidBuild = readText('android/app/build.gradle')
    const xcodeProject = readText('ios/Razvilka.xcodeproj/project.pbxproj')

    expect(androidBuild).toContain('entryFile = file("$projectRoot/index.js")')
    expect(androidBuild).toContain("require.resolve('react-native/cli.js'")
    expect(androidBuild).not.toContain("require.resolve('@expo/cli'")
    expect(androidBuild).not.toContain('bundleCommand = "export:embed"')

    expect(xcodeProject).toContain(
      'export ENTRY_FILE=\\"${ENTRY_FILE:-$PROJECT_ROOT/index.js}\\"',
    )
    expect(xcodeProject).not.toContain(
      "require('expo/scripts/resolveAppEntry')",
    )
    expect(xcodeProject).not.toContain("require.resolve('@expo/cli'")
    expect(xcodeProject).not.toContain('export BUNDLE_COMMAND="export:embed"')
  })
})
