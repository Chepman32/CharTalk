import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

export interface AndroidUiBounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface AndroidUiNode {
  index: number | null
  text: string
  resourceId: string
  contentDescription: string
  className: string
  clickable: boolean
  enabled: boolean
  bounds: AndroidUiBounds | null
}

export interface AndroidUiNodeMatcher {
  resourceId?: string
  text?: string | RegExp
  contentDescription?: string | RegExp
}

export interface AndroidChoiceAccessibilityContract {
  choiceIds: string[]
  labels: string[]
  nodes: AndroidUiNode[]
}

export interface AndroidReleaseSmokeOptions {
  adbPath?: string
  apkPath?: string
  packageName?: string
  activity?: string
  timeoutMs?: number
  requireDevice?: boolean
  offline?: boolean
}

export interface AndroidReleaseSmokeResult {
  skipped: boolean
  device?: string
  choiceIds?: string[]
  resumedStory?: string
  interruptionBoundaries?: string[]
}

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(moduleDirectory, '..')
const defaultPackageName = 'app.chartalk.reader'
const defaultActivity = '.MainActivity'
const dumpPath = '/sdcard/chartalk-window.xml'

function decodeXmlAttribute(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function parseAttributeMap(source: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const attributePattern = /([A-Za-z_:][\w:.-]*)="([^"]*)"/g
  for (const match of source.matchAll(attributePattern)) {
    attributes[match[1]] = decodeXmlAttribute(match[2])
  }
  return attributes
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true'
}

function parseBounds(value: string | undefined): AndroidUiBounds | null {
  if (!value) return null
  const match = /^\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]$/.exec(value)
  if (!match) return null
  return {
    left: Number(match[1]),
    top: Number(match[2]),
    right: Number(match[3]),
    bottom: Number(match[4]),
  }
}

/** Parse the flat <node ... /> elements emitted by `uiautomator dump`. */
export function parseAndroidUiDump(xml: string): AndroidUiNode[] {
  const nodes: AndroidUiNode[] = []
  const nodePattern = /<node\b([^>]*?)(?:\/>|>)/g
  for (const match of xml.matchAll(nodePattern)) {
    const attributes = parseAttributeMap(match[1])
    const parsedIndex = attributes.index
      ? Number.parseInt(attributes.index, 10)
      : Number.NaN
    nodes.push({
      index: Number.isInteger(parsedIndex) ? parsedIndex : null,
      text: attributes.text ?? '',
      resourceId: attributes['resource-id'] ?? '',
      contentDescription: attributes['content-desc'] ?? '',
      className: attributes.class ?? '',
      clickable: parseBoolean(attributes.clickable),
      enabled: parseBoolean(attributes.enabled),
      bounds: parseBounds(attributes.bounds),
    })
  }
  return nodes
}

function matchesValue(value: string, expected: string | RegExp): boolean {
  if (typeof expected === 'string') return value === expected
  expected.lastIndex = 0
  return expected.test(value)
}

export function findAndroidUiNode(
  nodes: AndroidUiNode[],
  matcher: AndroidUiNodeMatcher,
): AndroidUiNode | undefined {
  return nodes.find(node => {
    if (
      matcher.resourceId !== undefined &&
      node.resourceId !== matcher.resourceId
    )
      return false
    if (matcher.text !== undefined && !matchesValue(node.text, matcher.text))
      return false
    if (
      matcher.contentDescription !== undefined &&
      !matchesValue(node.contentDescription, matcher.contentDescription)
    )
      return false
    return true
  })
}

export function boundsCenter(node: AndroidUiNode): { x: number; y: number } {
  if (!node.bounds) {
    throw new Error(
      `cannot tap ${node.resourceId || node.contentDescription || node.text || 'Android node'} without bounds`,
    )
  }
  return {
    x: Math.round((node.bounds.left + node.bounds.right) / 2),
    y: Math.round((node.bounds.top + node.bounds.bottom) / 2),
  }
}

/**
 * Assert the semantic contract used by the reader's choice controls.
 * This intentionally checks the accessibility announcement, not just the
 * visible button count, so a native release smoke run catches regressions
 * that a screenshot-only test cannot see.
 */
export function assertFourChoiceAccessibilityContract(
  nodes: AndroidUiNode[],
): AndroidChoiceAccessibilityContract {
  const choices = nodes
    .filter(node => /^choice-\d+$/.test(node.resourceId))
    .sort((left, right) => {
      const leftNumber = Number(left.resourceId.slice('choice-'.length))
      const rightNumber = Number(right.resourceId.slice('choice-'.length))
      return leftNumber - rightNumber
    })

  if (choices.length !== 4) {
    throw new Error(
      `expected exactly four choice controls, received ${choices.length}`,
    )
  }

  const expectedIds = ['choice-1', 'choice-2', 'choice-3', 'choice-4']
  for (const [position, node] of choices.entries()) {
    const expectedPosition = position + 1
    if (node.resourceId !== expectedIds[position]) {
      throw new Error(
        `expected choice-${expectedPosition} control, received ${node.resourceId}`,
      )
    }
    if (!node.enabled) {
      throw new Error(`${node.resourceId} must be enabled`)
    }
    if (!node.clickable) {
      throw new Error(`${node.resourceId} must be clickable`)
    }
    const expectedPrefix = `Вариант ${expectedPosition} из 4:`
    if (!node.contentDescription.startsWith(expectedPrefix)) {
      throw new Error(
        `${node.resourceId} label must start with "${expectedPrefix}"; received "${node.contentDescription}"`,
      )
    }
  }

  return {
    choiceIds: choices.map(node => node.resourceId),
    labels: choices.map(node => node.contentDescription),
    nodes: choices,
  }
}

function defaultAdbPath(): string {
  const candidates = [
    process.env.ANDROID_ADB,
    process.env.ANDROID_HOME
      ? resolve(process.env.ANDROID_HOME, 'platform-tools/adb')
      : undefined,
    '/Users/antonchepur/Library/Android/sdk/platform-tools/adb',
  ]
  return (
    candidates.find(candidate => candidate && existsSync(candidate)) ?? 'adb'
  )
}

function runAdb(adbPath: string, args: string[]): string {
  const result = spawnSync(adbPath, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.error)
    throw new Error(`adb ${args.join(' ')} failed: ${result.error.message}`)
  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || '').trim()
    throw new Error(
      `adb ${args.join(' ')} failed with exit ${result.status}${detail ? `: ${detail}` : ''}`,
    )
  }
  return String(result.stdout ?? '')
}

function connectedDevices(adbPath: string): string[] {
  const output = runAdb(adbPath, ['devices'])
  return output
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length >= 2 && parts[1] === 'device')
    .map(parts => parts[0])
}

function dumpAndroidUi(adbPath: string, serial: string): AndroidUiNode[] {
  runAdb(adbPath, ['-s', serial, 'shell', 'uiautomator', 'dump', dumpPath])
  const xml = runAdb(adbPath, ['-s', serial, 'exec-out', 'cat', dumpPath])
  return parseAndroidUiDump(xml)
}

function waitForAndroidNode(
  adbPath: string,
  serial: string,
  matcher: AndroidUiNodeMatcher,
  timeoutMs: number,
): AndroidUiNode {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  while (Date.now() <= deadline) {
    try {
      const node = findAndroidUiNode(dumpAndroidUi(adbPath, serial), matcher)
      if (node) return node
    } catch (error) {
      lastError = error
    }
    const remaining = deadline - Date.now()
    if (remaining > 0) {
      const waitMs = Math.min(250, remaining)
      spawnSync('sleep', [String(waitMs / 1000)])
    }
  }
  const matcherDescription = JSON.stringify(matcher)
  throw new Error(
    `timed out waiting for Android UI node ${matcherDescription}${lastError ? ` (${String(lastError)})` : ''}`,
  )
}

function waitForAnyAndroidNode(
  adbPath: string,
  serial: string,
  matchers: AndroidUiNodeMatcher[],
  timeoutMs: number,
): AndroidUiNode {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  while (Date.now() <= deadline) {
    try {
      const nodes = dumpAndroidUi(adbPath, serial)
      for (const matcher of matchers) {
        const node = findAndroidUiNode(nodes, matcher)
        if (node) return node
      }
    } catch (error) {
      lastError = error
    }
    const remaining = deadline - Date.now()
    if (remaining > 0)
      spawnSync('sleep', [String(Math.min(0.25, remaining / 1000))])
  }
  throw new Error(
    `timed out waiting for any Android UI node ${JSON.stringify(matchers)}${lastError ? ` (${String(lastError)})` : ''}`,
  )
}

function tapAndroidNode(
  adbPath: string,
  serial: string,
  node: AndroidUiNode,
): void {
  const { x, y } = boundsCenter(node)
  runAdb(adbPath, ['-s', serial, 'shell', 'input', 'tap', String(x), String(y)])
}

function tapAndWait(
  adbPath: string,
  serial: string,
  node: AndroidUiNode,
  matcher: AndroidUiNodeMatcher,
  timeoutMs: number,
): AndroidUiNode {
  tapAndroidNode(adbPath, serial, node)
  return waitForAndroidNode(adbPath, serial, matcher, timeoutMs)
}

function swipeAndroidScreen(adbPath: string, serial: string): void {
  runAdb(adbPath, [
    '-s',
    serial,
    'shell',
    'input',
    'swipe',
    '540',
    '2050',
    '540',
    '600',
    '500',
  ])
}

function waitForAndroidNodeWithScroll(
  adbPath: string,
  serial: string,
  matcher: AndroidUiNodeMatcher,
  timeoutMs: number,
  maxSwipes = 8,
): AndroidUiNode {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  for (
    let swipe = 0;
    swipe <= maxSwipes && Date.now() <= deadline;
    swipe += 1
  ) {
    try {
      const node = findAndroidUiNode(dumpAndroidUi(adbPath, serial), matcher)
      if (node) return node
    } catch (error) {
      lastError = error
    }
    if (swipe === maxSwipes) break
    swipeAndroidScreen(adbPath, serial)
    const remaining = deadline - Date.now()
    if (remaining > 0) {
      spawnSync('sleep', [String(Math.min(0.35, remaining / 1000))])
    }
  }
  throw new Error(
    `timed out waiting for Android UI node while scrolling ${JSON.stringify(matcher)}${lastError ? ` (${String(lastError)})` : ''}`,
  )
}

function launchAndroidApp(
  adbPath: string,
  serial: string,
  packageName: string,
  activity: string,
): void {
  runAdb(adbPath, [
    '-s',
    serial,
    'shell',
    'am',
    'start',
    '-n',
    `${packageName}/${activity}`,
  ])
}

function forceStopAndRelaunch(
  adbPath: string,
  serial: string,
  packageName: string,
  activity: string,
): void {
  runAdb(adbPath, ['-s', serial, 'shell', 'am', 'force-stop', packageName])
  launchAndroidApp(adbPath, serial, packageName, activity)
}

function setAndroidConnectivity(
  adbPath: string,
  serial: string,
  enabled: boolean,
): void {
  const action = enabled ? 'enable' : 'disable'
  runAdb(adbPath, ['-s', serial, 'shell', 'svc', 'wifi', action])
  runAdb(adbPath, ['-s', serial, 'shell', 'svc', 'data', action])
}

function waitForResumedRunNode(
  adbPath: string,
  serial: string,
  matchers: AndroidUiNodeMatcher[],
  timeoutMs: number,
): AndroidUiNode {
  const entry = waitForAnyAndroidNode(
    adbPath,
    serial,
    [...matchers, { resourceId: 'stories-screen' }],
    timeoutMs,
  )
  if (entry.resourceId !== 'stories-screen') return entry

  const storyCard = waitForStoryCard(adbPath, serial, timeoutMs)
  tapAndroidNode(adbPath, serial, storyCard)
  return waitForAnyAndroidNode(adbPath, serial, matchers, timeoutMs)
}

function waitForStoryCard(
  adbPath: string,
  serial: string,
  timeoutMs: number,
): AndroidUiNode {
  return waitForAndroidNode(
    adbPath,
    serial,
    {
      contentDescription: /После дедлайна/,
    },
    timeoutMs,
  )
}

export function runAndroidReleaseSmoke(
  projectRootOverride = projectRoot,
  options: AndroidReleaseSmokeOptions = {},
): AndroidReleaseSmokeResult {
  const adbPath = options.adbPath ?? defaultAdbPath()
  const packageName = options.packageName ?? defaultPackageName
  const activity = options.activity ?? defaultActivity
  // The bundled catalog now includes a 29k-node fixture. Give a cold SQLite
  // seed and the first native image decode enough time on slower emulators.
  const timeoutMs = options.timeoutMs ?? 60_000
  const apkPath = resolve(
    projectRootOverride,
    options.apkPath ??
      'apps/mobile/android/app/build/outputs/apk/release/app-release.apk',
  )

  let devices: string[]
  try {
    devices = connectedDevices(adbPath)
  } catch (error) {
    if (!options.requireDevice) {
      console.warn(`Android native smoke skipped: ${String(error)}`)
      return { skipped: true }
    }
    throw error
  }
  if (devices.length === 0) {
    if (options.requireDevice)
      throw new Error('Android native smoke requires a connected device')
    console.warn('Android native smoke skipped: no connected Android device')
    return { skipped: true }
  }
  if (!existsSync(apkPath)) {
    throw new Error(`Android native smoke APK is missing: ${apkPath}`)
  }

  const serial = devices[0]
  if (options.offline) setAndroidConnectivity(adbPath, serial, false)

  try {
    runAdb(adbPath, ['-s', serial, 'install', '-r', '-d', apkPath])
    runAdb(adbPath, ['-s', serial, 'shell', 'pm', 'clear', packageName])
    runAdb(adbPath, ['-s', serial, 'shell', 'am', 'force-stop', packageName])
    launchAndroidApp(adbPath, serial, packageName, activity)

    const beginNow = waitForAndroidNode(
      adbPath,
      serial,
      {
        contentDescription: 'Начать сразу',
      },
      timeoutMs,
    )
    const storiesScreen = tapAndWait(
      adbPath,
      serial,
      beginNow,
      { resourceId: 'stories-screen' },
      timeoutMs,
    )
    const storyCard = waitForStoryCard(adbPath, serial, timeoutMs)
    tapAndroidNode(adbPath, serial, storyCard)
    const detail = waitForAndroidNodeWithScroll(
      adbPath,
      serial,
      { resourceId: 'start-story' },
      timeoutMs,
    )
    tapAndroidNode(adbPath, serial, detail)
    const firstChoice = waitForAndroidNode(
      adbPath,
      serial,
      {
        resourceId: 'choice-4',
      },
      timeoutMs,
    )
    const nodesAfterStart = dumpAndroidUi(adbPath, serial)
    const contract = assertFourChoiceAccessibilityContract(nodesAfterStart)

    const interruptionBoundaries = ['waiting']
    forceStopAndRelaunch(adbPath, serial, packageName, activity)
    waitForResumedRunNode(
      adbPath,
      serial,
      [{ resourceId: 'choice-1' }],
      timeoutMs,
    )

    const resumedWaitingContract = assertFourChoiceAccessibilityContract(
      dumpAndroidUi(adbPath, serial),
    )
    tapAndroidNode(adbPath, serial, resumedWaitingContract.nodes[3])
    waitForAndroidNode(adbPath, serial, { resourceId: 'choice-1' }, timeoutMs)

    interruptionBoundaries.push('committed')
    forceStopAndRelaunch(adbPath, serial, packageName, activity)
    const resumedEntry = waitForResumedRunNode(
      adbPath,
      serial,
      [{ resourceId: 'choice-1' }],
      timeoutMs,
    )
    const resumedStoryDescription =
      resumedEntry.contentDescription || 'direct run screen'

    console.log(
      `Android native smoke passed on ${serial}${options.offline ? ' offline' : ''}: ${contract.choiceIds.join(', ')} accessible; a choice committed immediately and waiting/committed states resumed after force-stop.`,
    )
    void storiesScreen
    void firstChoice
    return {
      skipped: false,
      device: serial,
      choiceIds: contract.choiceIds,
      resumedStory: resumedStoryDescription,
      interruptionBoundaries,
    }
  } finally {
    if (options.offline) setAndroidConnectivity(adbPath, serial, true)
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    runAndroidReleaseSmoke(undefined, {
      requireDevice: process.argv.includes('--require-device'),
      offline: process.argv.includes('--offline'),
    })
    process.exitCode = 0
  } catch (error) {
    console.error(`Android native smoke failed: ${String(error)}`)
    process.exitCode = 1
  }
}
