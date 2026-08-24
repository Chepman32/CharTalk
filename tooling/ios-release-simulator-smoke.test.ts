import { describe, expect, it } from 'vitest'
import {
  chooseSimulatorDevice,
  parseIosSimulatorSmokeArgs,
  parseSimulatorDevices,
  resolveIosSimulatorAppPath,
  screenshotDigest,
} from './ios-release-simulator-smoke'

const devicesJson = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-26-2': [
      {
        isAvailable: true,
        name: 'iPhone 17 Pro',
        state: 'Shutdown',
        udid: 'IPHONE-17-PRO',
      },
      {
        isAvailable: true,
        name: 'iPhone 16e',
        state: 'Booted',
        udid: 'IPHONE-16E',
      },
      {
        isAvailable: false,
        name: 'iPhone unavailable',
        state: 'Shutdown',
        udid: 'IPHONE-OFF',
      },
    ],
    'com.apple.CoreSimulator.SimRuntime.iPadOS-26-2': [
      {
        isAvailable: true,
        name: 'iPad Pro',
        state: 'Booted',
        udid: 'IPAD-PRO',
      },
    ],
  },
})

describe('iOS Release Simulator smoke helpers', () => {
  it('parses only available iPhone simulators from simctl JSON', () => {
    expect(parseSimulatorDevices(devicesJson)).toEqual([
      {
        isAvailable: true,
        name: 'iPhone 17 Pro',
        runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-26-2',
        state: 'Shutdown',
        udid: 'IPHONE-17-PRO',
      },
      {
        isAvailable: true,
        name: 'iPhone 16e',
        runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-26-2',
        state: 'Booted',
        udid: 'IPHONE-16E',
      },
    ])
  })

  it('prefers an explicit device, then a booted iPhone, then the first iPhone', () => {
    const devices = parseSimulatorDevices(devicesJson)
    expect(chooseSimulatorDevice(devices, 'IPHONE-17-PRO')?.udid).toBe(
      'IPHONE-17-PRO',
    )
    expect(chooseSimulatorDevice(devices)?.udid).toBe('IPHONE-16E')
    expect(
      chooseSimulatorDevice(
        devices.map(device => ({ ...device, state: 'Shutdown' })),
      )?.udid,
    ).toBe('IPHONE-17-PRO')
    expect(chooseSimulatorDevice(devices, 'missing')).toBeNull()
    expect(chooseSimulatorDevice([])).toBeNull()
  })

  it('resolves the default Release Simulator app path and honors an override', () => {
    expect(resolveIosSimulatorAppPath('/tmp/razvilka-derived')).toBe(
      '/tmp/razvilka-derived/Build/Products/Release-iphonesimulator/Razvilka.app',
    )
    expect(
      resolveIosSimulatorAppPath('/tmp/razvilka-derived', '/tmp/custom.app'),
    ).toBe('/tmp/custom.app')
  })

  it('parses smoke CLI options without losing defaults', () => {
    expect(
      parseIosSimulatorSmokeArgs([
        '--derived-data=/tmp/razvilka-derived',
        '--device=IPHONE-17-PRO',
        '--screenshots=/tmp/razvilka-shots',
        '--require-device',
      ]),
    ).toEqual({
      derivedDataPath: '/tmp/razvilka-derived',
      deviceId: 'IPHONE-17-PRO',
      requireDevice: true,
      screenshotDirectory: '/tmp/razvilka-shots',
    })
    expect(parseIosSimulatorSmokeArgs([])).toEqual({
      derivedDataPath: undefined,
      deviceId: undefined,
      requireDevice: false,
      screenshotDirectory: undefined,
    })
  })

  it('hashes screenshots deterministically so relaunch drift is visible', () => {
    expect(screenshotDigest(Buffer.from('same'))).toBe(
      screenshotDigest(Buffer.from('same')),
    )
    expect(screenshotDigest(Buffer.from('same'))).not.toBe(
      screenshotDigest(Buffer.from('different')),
    )
  })
})
