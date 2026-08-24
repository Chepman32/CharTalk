import { describe, expect, it } from 'vitest'
import { createIosReleaseBuildPlan } from './ios-release-build'

describe('iOS Release build plan', () => {
  it('builds the CocoaPods workspace with the signed-candidate configuration', () => {
    const plan = createIosReleaseBuildPlan(
      '/workspace/apps/mobile/ios',
      '/tmp/razvilka-derived',
    )

    expect(plan.workspacePath).toBe(
      '/workspace/apps/mobile/ios/Razvilka.xcworkspace',
    )
    expect(plan.args).toEqual([
      '-workspace',
      '/workspace/apps/mobile/ios/Razvilka.xcworkspace',
      '-scheme',
      'Razvilka',
      '-configuration',
      'Release',
      '-sdk',
      'iphonesimulator',
      '-destination',
      'generic/platform=iOS Simulator',
      '-derivedDataPath',
      '/tmp/razvilka-derived',
      '-quiet',
      'CODE_SIGNING_ALLOWED=NO',
      'build',
    ])
  })
})
