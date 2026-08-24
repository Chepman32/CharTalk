import { describe, expect, it } from 'vitest'

import { secureServiceBaseUrl } from './secure-endpoint'

describe('secureServiceBaseUrl', () => {
  it('accepts HTTPS endpoints and removes a trailing slash', () => {
    expect(secureServiceBaseUrl('https://api.razvilka.app/')).toBe(
      'https://api.razvilka.app',
    )
    expect(secureServiceBaseUrl('https://api.razvilka.app/v1')).toBe(
      'https://api.razvilka.app/v1',
    )
  })

  it.each([
    'http://localhost:8787/',
    'http://127.0.0.1:8787',
    'http://[::1]:8787',
  ])('allows the loopback development endpoint %s', endpoint => {
    expect(secureServiceBaseUrl(endpoint)).toBe(endpoint.replace(/\/$/, ''))
  })

  it.each([
    undefined,
    '',
    'not a URL',
    'http://api.razvilka.app',
    'http://localhost.example.com',
    'ftp://api.razvilka.app',
    'https://publisher:secret@api.razvilka.app',
    'https://api.razvilka.app/?token=secret',
    'https://api.razvilka.app/#fragment',
  ])('rejects an unsafe endpoint %s', endpoint => {
    expect(secureServiceBaseUrl(endpoint)).toBeUndefined()
  })
})
