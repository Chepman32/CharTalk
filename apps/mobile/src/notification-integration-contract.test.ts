import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const onboardingSource = readFileSync(
  new URL('../app/onboarding.tsx', import.meta.url),
  'utf8',
)
const rootLayoutSource = readFileSync(
  new URL('../app/_layout.tsx', import.meta.url),
  'utf8',
)
const nativeGatewaySource = readFileSync(
  new URL('./notifications/notification-gateway.native.ts', import.meta.url),
  'utf8',
)

describe('notification integration', () => {
  it('requests permission only when finishing the final onboarding slide', () => {
    expect({
      requestsPermission: onboardingSource.includes(
        'requestNotificationPermission',
      ),
      finalActionRequests: onboardingSource.includes('finish(true)'),
      skipActionDoesNotRequest: onboardingSource.includes('finish(false)'),
    }).toEqual({
      requestsPermission: true,
      finalActionRequests: true,
      skipActionDoesNotRequest: true,
    })
  })

  it('mounts the reminder coordinator at the application root', () => {
    expect(rootLayoutSource.includes('<NotificationCoordinator />')).toBe(true)
  })

  it('uses the platform default sound without treating it as a custom file', () => {
    expect(nativeGatewaySource).not.toContain("sound: 'default'")
    expect(nativeGatewaySource).toContain('sound: true')
  })
})
