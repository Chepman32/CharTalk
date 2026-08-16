import * as Crypto from 'expo-crypto'

/** Generate an id through Expo's native/web crypto bridge on every platform. */
export function createOperationId(): string {
  return Crypto.randomUUID()
}
