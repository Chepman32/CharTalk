import { Buffer } from 'node:buffer'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const sampleRate = 44_100

function createWave(path, durationSeconds, frequencies) {
  const sampleCount = Math.round(sampleRate * durationSeconds)
  const dataBytes = sampleCount * 2
  const buffer = Buffer.alloc(44 + dataBytes)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataBytes, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataBytes, 40)
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate
    const envelope = Math.sin(Math.PI * (index / sampleCount)) ** 1.6
    const signal = frequencies.reduce(
      (sum, frequency, toneIndex) =>
        sum +
        Math.sin(2 * Math.PI * frequency * time) /
          (frequencies.length * (toneIndex + 1)),
      0,
    )
    buffer.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, signal * envelope * 0.18)) * 32767),
      44 + index * 2,
    )
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, buffer)
}

const output = resolve('apps/mobile/assets/audio')
createWave(resolve(output, 'choice.wav'), 0.07, [520, 780])
createWave(resolve(output, 'commit.wav'), 0.11, [440, 660, 880])
