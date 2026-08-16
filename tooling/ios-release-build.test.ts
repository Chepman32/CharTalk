import { describe, expect, it } from 'vitest'
import { createIosReleaseBuildPlan } from './ios-release-build'

describe('iOS Release build plan', () => {
  it('builds the CocoaPods workspace with the signed-candidate configuration', () => {
    const plan = createIosReleaseBuildPlan(
      '/workspace/apps/mobile/ios',
      '/tmp/chartalk-derived',
    )

    expect(plan.workspacePath).toBe(
      '/workspace/apps/mobile/ios/CharTalk.xcworkspace',
    )
    expect(plan.args).toEqual([
      '-workspace',
      '/workspace/apps/mobile/ios/CharTalk.xcworkspace',
      '-scheme',
      'CharTalk',
      '-configuration',
      'Release',
      '-sdk',
      'iphonesimulator',
      '-destination',
      'generic/platform=iOS Simulator',
      '-derivedDataPath',
      '/tmp/chartalk-derived',
      '-quiet',
      'CODE_SIGNING_ALLOWED=NO',
      'build',
    ])
  })
})
