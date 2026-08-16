import { spawnSync } from 'node:child_process'

import { describe, expect, it } from 'vitest'

const runParserProbe = (script: string) =>
  spawnSync(process.execPath, ['-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 2_000,
  })

const expectMalformedImageToTerminate = (script: string) => {
  const result = runParserProbe(script)

  expect(result.error).toBeUndefined()
  expect(result.signal).toBeNull()
  expect(result.status, result.stderr).toBe(0)
}

describe('image-size denial-of-service hardening', () => {
  it('rejects a zero-length ICNS entry instead of looping forever', () => {
    expectMalformedImageToTerminate(`
      const { imageSize } = require('image-size')
      const input = Buffer.alloc(16)
      input.write('icns', 0, 'ascii')
      input.writeUInt32BE(16, 4)
      input.write('icp4', 8, 'ascii')
      input.writeUInt32BE(0, 12)

      try {
        imageSize(input)
        process.exit(1)
      } catch {
        process.exit(0)
      }
    `)
  })

  it('rejects a zero-length JXL partial stream instead of looping forever', () => {
    expectMalformedImageToTerminate(`
      const { JXL } = require('image-size/dist/types/jxl.js')
      const input = Buffer.alloc(40)
      input.writeUInt32BE(12, 0)
      input.write('JXL ', 4, 'ascii')
      input.writeUInt32BE(20, 12)
      input.write('ftyp', 16, 'ascii')
      input.write('jxl ', 20, 'ascii')
      input.writeUInt32BE(0, 32)
      input.write('jxlp', 36, 'ascii')

      try {
        JXL.calculate(input)
        process.exit(1)
      } catch {
        process.exit(0)
      }
    `)
  })
})
