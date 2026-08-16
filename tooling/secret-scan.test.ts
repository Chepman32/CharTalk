import { describe, expect, it } from 'vitest'

import { scanText } from './secret-scan'

describe('secret scan', () => {
  it('finds high-confidence provider credentials without returning their value', () => {
    const awsKey = ['AKIA', '1234567890ABCDEF'].join('')
    const source = ['const safe = true', `access = '${awsKey}'`].join('\n')

    expect(scanText(source, 'fixture.ts')).toEqual([
      {
        file: 'fixture.ts',
        line: 2,
        rule: 'AWS access key ID',
      },
    ])
    expect(JSON.stringify(scanText(source, 'fixture.ts'))).not.toContain(awsKey)
  })

  it('finds private keys and high-entropy credential assignments', () => {
    const privateKey = ['-----BEGIN ', 'PRIVATE KEY-----'].join('')
    const genericCredential = ['v1_', 'H6qoS7hi9Fh5XWvQ9Uo3zK8mP2'].join('')
    const source = [
      privateKey,
      ['client_', 'sec', `ret = '${genericCredential}'`].join(''),
    ].join('\n')

    expect(scanText(source, '.env')).toEqual([
      { file: '.env', line: 1, rule: 'private key material' },
      { file: '.env', line: 2, rule: 'embedded credential assignment' },
    ])
  })

  it('allows environment lookups and explicit development fixtures', () => {
    const source = `
      const token = process.env.CHARTALK_ADMIN_TOKEN
      const adminToken = 'development-admin-token-change-me'
      const testToken = 'test-admin-token-with-entropy'
      const placeholderSecret = 'replace-with-production-secret'
    `

    expect(scanText(source, 'server.test.ts')).toEqual([])
  })
})
