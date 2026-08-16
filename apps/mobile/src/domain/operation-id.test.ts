import { describe, expect, it, vi } from 'vitest'

const cryptoMock = vi.hoisted(() => ({
  randomUUID: vi.fn(() => 'native-operation-id'),
}))

vi.mock('expo-crypto', () => cryptoMock)

import { createOperationId } from './operation-id'

describe('createOperationId', () => {
  it('uses the platform cryptography provider for native-safe operation IDs', () => {
    expect(createOperationId()).toBe('native-operation-id')
    expect(cryptoMock.randomUUID).toHaveBeenCalledOnce()
  })
})
