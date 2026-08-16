import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'

export interface IosSimulatorDevice {
  isAvailable: boolean
  name: string
  runtime: string
  state: string
  udid: string
}

export interface IosSimulatorSmokeArgs {
  appPath?: string
  derivedDataPath?: string
  deviceId?: string
  requireDevice: boolean
  screenshotDirectory?: string
}

export interface IosSimulatorSmokeOptions extends IosSimulatorSmokeArgs {
  simctlPath?: string
}

export interface IosSimulatorSmokeResult {
  appPath?: string
  device?: IosSimulatorDevice
  firstScreenshotPath?: string
  firstScreenshotDigest?: string
  relaunchScreenshotPath?: string
  relaunchScreenshotDigest?: string
  skipped: boolean
}

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(moduleDirectory, '..')
const defaultBundleId = 'app.chartalk.reader'

export function parseSimulatorDevices(source: string): IosSimulatorDevice[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch {
    return []
  }
  if (!isRecord(parsed) || !isRecord(parsed.devices)) return []

  const devices: IosSimulatorDevice[] = []
  for (const [runtime, runtimeDevices] of Object.entries(parsed.devices)) {
    if (!runtime.includes('iOS') || !Array.isArray(runtimeDevices)) continue
    for (const value of runtimeDevices) {
      if (!isRecord(value)) continue
      const name = typeof value.name === 'string' ? value.name : ''
      const udid = typeof value.udid === 'string' ? value.udid : ''
      const state = typeof value.state === 'string' ? value.state : ''
      if (!name.startsWith('iPhone') || !udid || !state) continue
      if (value.isAvailable === false) continue
      devices.push({
        isAvailable: true,
        name,
        runtime,
        state,
        udid,
      })
    }
  }
  return devices
}

export function chooseSimulatorDevice(
  devices: readonly IosSimulatorDevice[],
  preferredUdid?: string,
): IosSimulatorDevice | null {
  if (preferredUdid) {
    return devices.find(device => device.udid === preferredUdid) ?? null
  }
  return devices.find(device => device.state === 'Booted') ?? devices[0] ?? null
}

export function resolveIosSimulatorAppPath(
  derivedDataPath: string,
  explicitAppPath?: string,
): string {
  if (explicitAppPath) return resolve(explicitAppPath)
  return resolve(
    derivedDataPath,
    'Build',
    'Products',
    'Release-iphonesimulator',
    'CharTalk.app',
  )
}

export function parseIosSimulatorSmokeArgs(
  argv: readonly string[],
): IosSimulatorSmokeArgs {
  const args: IosSimulatorSmokeArgs = {
    appPath: undefined,
    derivedDataPath: undefined,
    deviceId: undefined,
    requireDevice: false,
    screenshotDirectory: undefined,
  }
  for (const argument of argv) {
    if (argument === '--require-device') {
      args.requireDevice = true
    } else if (argument.startsWith('--app=')) {
      args.appPath = argument.slice('--app='.length)
    } else if (argument.startsWith('--derived-data=')) {
      args.derivedDataPath = argument.slice('--derived-data='.length)
    } else if (argument.startsWith('--device=')) {
      args.deviceId = argument.slice('--device='.length)
    } else if (argument.startsWith('--screenshots=')) {
      args.screenshotDirectory = argument.slice('--screenshots='.length)
    } else {
      throw new Error(`Unknown iOS Simulator smoke argument: ${argument}`)
    }
  }
  return args
}

export function screenshotDigest(contents: Uint8Array): string {
  return createHash('sha256').update(contents).digest('hex')
}

interface CommandResult {
  error?: Error
  status: number | null
  stderr: string
  stdout: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function runSimctl(simctlPath: string, args: readonly string[]): CommandResult {
  const result = spawnSync(simctlPath, ['simctl', ...args], {
    encoding: 'utf8',
  })
  return {
    error: result.error,
    status: result.status,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
  }
}

function commandError(command: string, result: CommandResult): Error {
  const detail = result.error?.message ?? result.stderr.trim()
  return new Error(
    detail ? `${command}: ${detail}` : `${command}: exited ${result.status}`,
  )
}

function requireSimctl(simctlPath: string, args: readonly string[]): string {
  const result = runSimctl(simctlPath, args)
  if (result.error || result.status !== 0) {
    throw commandError(`${simctlPath} simctl ${args.join(' ')}`, result)
  }
  return result.stdout.trim()
}

function screenshot(
  simctlPath: string,
  deviceId: string,
  path: string,
): string {
  const result = runSimctl(simctlPath, ['io', deviceId, 'screenshot', path])
  if (result.error || result.status !== 0) {
    throw commandError(`${simctlPath} simctl io screenshot`, result)
  }
  if (!existsSync(path)) throw new Error(`Screenshot was not written: ${path}`)
  return screenshotDigest(readFileSync(path))
}

function defaultScreenshotDirectory(): string {
  return mkdtempSync(join(tmpdir(), 'chartalk-ios-simulator-'))
}

export function runIosSimulatorSmoke(
  options: IosSimulatorSmokeOptions = { requireDevice: false },
): IosSimulatorSmokeResult {
  const simctlPath = options.simctlPath ?? 'xcrun'
  const availability = runSimctl(simctlPath, ['--version'])
  if (availability.error || availability.status !== 0) {
    if (options.requireDevice) {
      throw commandError(`${simctlPath} --version`, availability)
    }
    console.warn(
      `iOS Simulator smoke skipped: ${availability.error?.message ?? 'xcrun is unavailable'}`,
    )
    return { skipped: true }
  }

  const derivedDataPath =
    options.derivedDataPath ?? resolve(projectRoot, 'artifacts/ios-derived')
  const appPath = resolveIosSimulatorAppPath(derivedDataPath, options.appPath)
  if (!existsSync(appPath)) {
    throw new Error(
      `iOS Simulator smoke requires a Release app at ${appPath}. Run npm run test:ios:build first.`,
    )
  }

  const devicesJson = requireSimctl(simctlPath, [
    'list',
    'devices',
    'available',
    '--json',
  ])
  const devices = parseSimulatorDevices(devicesJson)
  const device = chooseSimulatorDevice(devices, options.deviceId)
  if (!device) {
    throw new Error(
      options.deviceId
        ? `Requested iPhone simulator ${options.deviceId} is not available.`
        : 'No available iPhone simulator was found.',
    )
  }

  if (device.state !== 'Booted') {
    requireSimctl(simctlPath, ['boot', device.udid])
  }
  requireSimctl(simctlPath, ['bootstatus', device.udid, '-b'])
  requireSimctl(simctlPath, ['install', device.udid, appPath])
  requireSimctl(simctlPath, ['launch', device.udid, defaultBundleId])

  const screenshotDirectory =
    options.screenshotDirectory ?? defaultScreenshotDirectory()
  mkdirSync(screenshotDirectory, { recursive: true })
  const firstScreenshotPath = join(screenshotDirectory, 'launch.png')
  const firstScreenshotDigest = screenshot(
    simctlPath,
    device.udid,
    firstScreenshotPath,
  )

  requireSimctl(simctlPath, ['terminate', device.udid, defaultBundleId])
  requireSimctl(simctlPath, ['launch', device.udid, defaultBundleId])
  const relaunchScreenshotPath = join(screenshotDirectory, 'relaunch.png')
  const relaunchScreenshotDigest = screenshot(
    simctlPath,
    device.udid,
    relaunchScreenshotPath,
  )

  console.log(
    `iOS Simulator smoke passed on ${device.name}: installed, launched, terminated, relaunched; screenshots ${firstScreenshotDigest.slice(0, 12)} / ${relaunchScreenshotDigest.slice(0, 12)}.`,
  )
  return {
    appPath,
    device,
    firstScreenshotDigest,
    firstScreenshotPath,
    relaunchScreenshotDigest,
    relaunchScreenshotPath,
    skipped: false,
  }
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  try {
    process.exitCode = 0
    runIosSimulatorSmoke(parseIosSimulatorSmokeArgs(process.argv.slice(2)))
  } catch (error) {
    console.error(
      `iOS Simulator smoke failed: ${error instanceof Error ? error.message : String(error)}`,
    )
    process.exitCode = 1
  }
}
