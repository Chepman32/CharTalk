import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = process.cwd()
const retiredBrand = ['char', 'talk'].join('')

const readJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(resolve(repositoryRoot, path), 'utf8')) as Record<
    string,
    unknown
  >

const readText = (path: string): string =>
  readFileSync(resolve(repositoryRoot, path), 'utf8')

const sha256 = (path: string): string =>
  createHash('sha256').update(readFileSync(path)).digest('hex')

const sourcePathspecs = [
  '.',
  ':(exclude).codebase-memory/**',
  ':(exclude)apps/mobile/ios/build/**',
  ':(exclude)artifacts/**',
  ':(exclude)output/**',
] as const

const trackedSourcePaths = (): string[] =>
  execFileSync('git', ['ls-files', '-z'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean)
    .filter(
      path =>
        !path.startsWith('.codebase-memory/') &&
        !path.startsWith('apps/mobile/ios/build/') &&
        !path.startsWith('artifacts/') &&
        !path.startsWith('output/') &&
        existsSync(resolve(repositoryRoot, path)),
    )

const pngMetadata = (
  path: string,
): { width: number; height: number; hasAlpha: boolean } => {
  const bytes = readFileSync(path)
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  )
  const colorType = bytes[25]

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    hasAlpha: colorType === 4 || colorType === 6,
  }
}

describe('product brand contract', () => {
  it('uses the exact public and machine identities for Развилка', () => {
    const appConfig = readJson('apps/mobile/app.json')
    const expo = appConfig.expo as Record<string, unknown>
    const ios = expo.ios as Record<string, unknown>
    const android = expo.android as Record<string, unknown>
    const rootPackage = readJson('package.json')
    const mobilePackage = readJson('apps/mobile/package.json')

    expect(expo.name).toBe('Развилка')
    expect(expo.slug).toBe('razvilka')
    expect(expo.scheme).toBe('razvilka')
    expect(ios.bundleIdentifier).toBe('app.razvilka.reader')
    expect(android.package).toBe('app.razvilka.reader')
    expect(rootPackage.name).toBe('razvilka')
    expect(mobilePackage.name).toBe('@razvilka/mobile')
    expect(
      existsSync(resolve(repositoryRoot, 'apps/mobile/ios/Razvilka.xcodeproj')),
    ).toBe(true)
    expect(
      existsSync(
        resolve(
          repositoryRoot,
          'apps/mobile/android/app/src/main/java/app/razvilka/reader',
        ),
      ),
    ).toBe(true)
    expect(readText('apps/mobile/ios/Razvilka/Info.plist')).toContain(
      '<string>Развилка</string>',
    )
    expect(
      readText('apps/mobile/android/app/src/main/res/values/strings.xml'),
    ).toContain('<string name="app_name">Развилка</string>')
    expect(readText('README.md')).toMatch(/^# Развилка$/m)
    expect(readText('DECISIONS.md')).toContain(
      'The public product name is «Развилка»',
    )
  })

  it('does not retain the retired brand in source paths or text', () => {
    const grep = spawnSync(
      'git',
      ['grep', '-I', '-l', '-i', retiredBrand, '--', ...sourcePathspecs],
      { cwd: repositoryRoot, encoding: 'utf8' },
    )
    if (grep.status !== 0 && grep.status !== 1) {
      throw new Error(grep.stderr || 'git grep failed')
    }
    const textMatches = grep.stdout.split('\n').filter(Boolean)
    const pathMatches = trackedSourcePaths()
      .filter(path => path.toLocaleLowerCase('en-US').includes(retiredBrand))
      .map(path => `${path} (path)`)

    expect([...pathMatches, ...textMatches]).toEqual([])
  })

  it('ships the approved icon master and native derivatives', () => {
    const iconPath = resolve(repositoryRoot, 'apps/mobile/assets/icon.png')
    const iosIconPath = resolve(
      repositoryRoot,
      'apps/mobile/ios/Razvilka/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
    )
    const adaptivePath = resolve(
      repositoryRoot,
      'apps/mobile/assets/adaptive-icon.png',
    )
    const faviconPath = resolve(
      repositoryRoot,
      'apps/mobile/assets/favicon.png',
    )
    const splashPath = resolve(
      repositoryRoot,
      'apps/mobile/assets/splash-icon.png',
    )
    const roundAndroidPath = resolve(
      repositoryRoot,
      'apps/mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.webp',
    )

    const icon = pngMetadata(iconPath)
    const iosIcon = pngMetadata(iosIconPath)
    const adaptive = pngMetadata(adaptivePath)
    const favicon = pngMetadata(faviconPath)
    const splash = pngMetadata(splashPath)
    const roundAndroid = pngMetadata(roundAndroidPath)

    expect([icon.width, icon.height, icon.hasAlpha]).toEqual([
      1024,
      1024,
      false,
    ])
    expect([iosIcon.width, iosIcon.height, iosIcon.hasAlpha]).toEqual([
      1024,
      1024,
      false,
    ])
    expect([adaptive.width, adaptive.height]).toEqual([432, 432])
    expect([favicon.width, favicon.height]).toEqual([64, 64])
    expect([splash.width, splash.height, splash.hasAlpha]).toEqual([
      512,
      512,
      true,
    ])
    expect([
      roundAndroid.width,
      roundAndroid.height,
      roundAndroid.hasAlpha,
    ]).toEqual([192, 192, true])
    expect(sha256(iosIconPath)).toBe(sha256(iconPath))
    expect(sha256(iconPath)).toBe(
      '4c9587cfa5fc1933a6bd9fe991b440b6ec259755bfa150e0ecb7f93d1e0ce766',
    )
  })
})
