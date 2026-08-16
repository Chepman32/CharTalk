import { describe, expect, it } from 'vitest'

import { compileContentPackage } from '@chartalk/content-compiler'

import { sampleContentPackage } from './index'

describe('sampleContentPackage', () => {
  it('compiles without blockers and exposes three playable entry points', () => {
    const report = compileContentPackage(sampleContentPackage)

    expect(report.blockers).toEqual([])
    expect(sampleContentPackage.characters).toHaveLength(3)
    expect(sampleContentPackage.stories).toHaveLength(3)
    expect(sampleContentPackage.episodes).toHaveLength(3)
    expect(report.counts.decisionNodeCount).toBeGreaterThanOrEqual(7)
  })

  it('does not miscount generated fixtures as approved content', () => {
    const report = compileContentPackage(sampleContentPackage)

    expect(report.counts.approvedTextUnitCount).toBe(0)
    expect(report.counts.fixtureTextUnitCount).toBeGreaterThan(50)
  })

  it('has a tested authored safe route for every high-intensity fixture scene', () => {
    const highIntensityWarnings = sampleContentPackage.warnings.filter(
      warning => warning.severity === 'high',
    )

    expect(highIntensityWarnings.length).toBeGreaterThan(0)
    for (const warning of highIntensityWarnings) {
      expect(warning.safeRoute.summary.length).toBeGreaterThan(0)
      expect(
        sampleContentPackage.nodes.some(
          node => node.nodeId === warning.safeRoute.nextNodeId,
        ),
      ).toBe(true)
    }
  })

  it('keeps the sample attachment reference inside the same bundled package', () => {
    const root = sampleContentPackage.nodes.find(
      node => node.nodeId === 'story.ira.after-deadline.decision.open',
    )
    const opening =
      root?.type === 'decision' ? root.messageVariants[0]?.messages[0] : null
    const asset = sampleContentPackage.assets.find(
      item => item.assetId === 'attachment.archive-note',
    )

    expect(opening?.kind).toBe('image')
    expect(opening?.assetId).toBe(asset?.assetId)
    expect(asset?.kind).toBe('attachment')
    expect(asset?.path).toBe('attachments/archive-note.png')
  })
})
