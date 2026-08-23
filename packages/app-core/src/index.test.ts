import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@chartalk/test-fixtures'

import {
  AppCoreError,
  DurableAppRepository,
  MemoryAppRepository,
  type AppSnapshot,
  type SnapshotStore,
  createEmptySnapshot,
  defaultSettings,
  renderAuthoredText,
} from './index'

const now = () => '2026-08-13T08:00:00.000Z'

describe('MemoryAppRepository', () => {
  it('renders approved name and grammatical placeholders without guessing declension', () => {
    const template =
      'Слушай, {{name}}. Ты {{form:пришёл|пришла|уже здесь}}, верно?'
    expect(
      renderAuthoredText(template, {
        displayName: 'Саша',
        selectedCharacterId: 'char.ira',
        grammarProfile: 'masculine',
        createdAt: now(),
      }),
    ).toBe('Слушай, Саша. Ты пришёл, верно?')
    expect(
      renderAuthoredText(template, {
        displayName: 'Саша',
        selectedCharacterId: 'char.ira',
        grammarProfile: 'feminine',
        createdAt: now(),
      }),
    ).toBe('Слушай, Саша. Ты пришла, верно?')
    expect(
      renderAuthoredText(template, {
        displayName: 'Саша',
        selectedCharacterId: 'char.ira',
        grammarProfile: 'neutralPhrasing',
        createdAt: now(),
      }),
    ).toBe('Слушай, Саша. Ты уже здесь, верно?')
    expect(() =>
      renderAuthoredText('{{unknown}}', {
        displayName: 'Саша',
        selectedCharacterId: 'char.ira',
        grammarProfile: 'neutralPhrasing',
        createdAt: now(),
      }),
    ).toThrow(/placeholder/i)
  })

  it('migrates legacy local reports without inventing upload consent', async () => {
    const legacy = {
      ...createEmptySnapshot(),
      schemaVersion: 1,
      settings: { ...defaultSettings, textScale: 'small' },
      reports: [
        {
          reportId: 'legacy-report',
          runId: null,
          nodeId: null,
          category: 'technical',
          note: null,
          status: 'queued',
          createdAt: now(),
        },
      ],
    } as unknown as AppSnapshot

    const repository = new MemoryAppRepository(sampleContentPackage, {
      initialSnapshot: legacy,
    })
    const snapshot = await repository.getSnapshot()

    expect(snapshot.schemaVersion).toBe(5)
    expect(snapshot.settings.textScale).toBe('standard')
    expect(snapshot.reports[0]).toMatchObject({
      consentGrantedAt: '',
      contentBuildId: sampleContentPackage.manifest.buildId,
      appVersion: 'unknown',
    })
  })

  it('adds notification preferences when upgrading an older snapshot', async () => {
    const legacy = {
      ...createEmptySnapshot(),
      schemaVersion: 4,
      settings: {
        notifications: true,
      },
    } as unknown as AppSnapshot

    const repository = new MemoryAppRepository(sampleContentPackage, {
      initialSnapshot: legacy,
    })
    const snapshot = await repository.getSnapshot()

    expect(snapshot.settings).toMatchObject({
      notifications: true,
      notificationDiscoveryReminders: true,
      notificationUnfinishedReminders: true,
      notificationFrequency: 'weekly',
      notificationWeekendDay: 'saturday',
      notificationTime: 'morning',
    })
  })

  it('completes onboarding and starts a durable local run', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, { now })
    await repository.completeOnboarding({
      displayName: 'Саша',
      selectedCharacterId: 'char.ira',
    })
    const run = await repository.createRun('story.ira.after-deadline')
    const snapshot = await repository.getSnapshot()

    expect(snapshot.profile?.displayName).toBe('Саша')
    expect(snapshot.profile?.grammarProfile).toBe('neutralPhrasing')
    expect(snapshot.settings).toEqual(defaultSettings)
    expect(run.activeNodeId).toBe('story.ira.after-deadline.decision.open')
    expect(run.packId).toBe(sampleContentPackage.manifest.packId)
    expect(run.transcript).toHaveLength(1)
  })

  it('writes a durable sync outbox entry with the committed event and run lineage', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, { now })
    const run = await repository.createRun('story.ira.after-deadline')

    const result = await repository.commitChoice({
      runId: run.runId,
      operationId: 'operation.sync.1',
      expectedSequence: 0,
      expectedNodeId: run.activeNodeId,
      choiceId: 'story.ira.after-deadline.choice.open.1',
    })

    expect((await repository.getSnapshot()).syncOutbox).toHaveLength(1)
    expect((await repository.listSyncOutbox())[0]).toMatchObject({
      entryId: result.event.eventId,
      event: result.event,
      run: {
        runId: result.run.runId,
        contentBuildId: result.run.contentBuildId,
        sequence: result.run.sequence,
        activeNodeId: result.run.activeNodeId,
      },
      attempts: 0,
    })

    await repository.markSyncEventAttempt(
      result.event.eventId,
      'NETWORK_UNAVAILABLE',
      now(),
    )
    expect((await repository.listSyncOutbox())[0]).toMatchObject({
      attempts: 1,
      lastErrorCode: 'NETWORK_UNAVAILABLE',
      lastAttemptAt: now(),
    })

    await repository.markSyncEventsAcknowledged([result.event.eventId])
    expect(await repository.listSyncOutbox()).toEqual([])
  })

  it('freezes authored attachment identity and alt text in the transcript', async () => {
    const content = structuredClone(sampleContentPackage)
    const opening = content.nodes.find(
      node => node.nodeId === 'story.ira.after-deadline.decision.open',
    )
    if (opening?.type !== 'decision') throw new Error('fixture changed')
    opening.messageVariants[0]!.messages[0] = {
      ...opening.messageVariants[0]!.messages[0]!,
      kind: 'image',
      assetId: 'portrait.ira',
      altText: 'Ира у стола с папками.',
    }
    const repository = new MemoryAppRepository(content, { now })

    const run = await repository.createRun('story.ira.after-deadline')

    expect(run.transcript[0]).toMatchObject({
      messageKind: 'image',
      assetId: 'portrait.ira',
      altText: 'Ира у стола с папками.',
    })
  })

  it('stores and updates grammatical addressing without treating it as gender', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, { now })
    await repository.completeOnboarding({
      displayName: '  Саша  ',
      selectedCharacterId: 'char.ira',
      grammarProfile: 'feminine',
    })
    await repository.updateProfile({
      displayName: 'Алекс',
      grammarProfile: 'neutralPhrasing',
    })

    expect((await repository.getSnapshot()).profile).toMatchObject({
      displayName: 'Алекс',
      grammarProfile: 'neutralPhrasing',
      createdAt: now(),
    })
  })

  it('forks only at authored checkpoints, keeps frozen text, and records lineage', async () => {
    const content = structuredClone(sampleContentPackage)
    const opening = content.nodes.find(
      node => node.nodeId === 'story.ira.after-deadline.decision.open',
    )
    if (opening?.type !== 'decision') throw new Error('fixture changed')
    opening.messageVariants[0]!.messages[0]!.text = 'Слушай, {{name}}.'
    const repository = new MemoryAppRepository(content, { now })
    await repository.completeOnboarding({
      displayName: 'Антон',
      selectedCharacterId: 'char.ira',
    })
    const source = await repository.createRun('story.ira.after-deadline')
    await repository.commitChoice({
      runId: source.runId,
      operationId: 'source-choice',
      expectedSequence: 0,
      expectedNodeId: source.activeNodeId,
      choiceId: 'story.ira.after-deadline.choice.open.1',
    })
    await repository.updateProfile({ displayName: 'Новое имя' })

    const branch = await repository.forkRun(source.runId, 0, 'Сначала иначе')

    expect(branch).toMatchObject({
      parentRunId: source.runId,
      branchFromSequence: 0,
      label: 'Сначала иначе',
      sequence: 0,
      status: 'active',
    })
    expect(branch.transcript[0]?.text).toBe('Слушай, Антон.')
    await expect(repository.forkRun(source.runId, 1)).rejects.toMatchObject({
      code: 'INVALID_BRANCH_POINT',
    })
  })

  it('renames and explicitly deletes a branch without orphaning its children', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, { now })
    const root = await repository.createRun('story.ira.after-deadline')
    const branch = await repository.forkRun(root.runId, 0)
    const child = await repository.forkRun(branch.runId, 0)

    await repository.renameRun(branch.runId, '  Вежливый путь  ')
    expect((await repository.getRun(branch.runId))?.label).toBe('Вежливый путь')

    await repository.deleteRun(branch.runId)
    expect(await repository.getRun(branch.runId)).toBeNull()
    expect((await repository.getRun(child.runId))?.parentRunId).toBe(root.runId)
  })

  it('commits exactly once when an operation is retried', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, { now })
    const run = await repository.createRun('story.ira.after-deadline')
    const request = {
      runId: run.runId,
      operationId: 'op-1',
      expectedSequence: 0,
      expectedNodeId: run.activeNodeId,
      choiceId: 'story.ira.after-deadline.choice.open.1',
    }

    const first = await repository.commitChoice(request)
    const retry = await repository.commitChoice(request)
    const stored = await repository.getRun(run.runId)

    expect(retry.event.eventId).toBe(first.event.eventId)
    expect(stored?.sequence).toBe(1)
    expect(stored?.events).toHaveLength(1)
    expect(
      stored?.transcript.filter(entry => entry.speakerId === 'player'),
    ).toHaveLength(1)
  })

  it('rejects a stale concurrent commit without changing the run', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, { now })
    const run = await repository.createRun('story.asya.seven-minutes')
    await repository.commitChoice({
      runId: run.runId,
      operationId: 'op-current',
      expectedSequence: 0,
      expectedNodeId: run.activeNodeId,
      choiceId: 'story.asya.seven-minutes.choice.open.1',
    })

    await expect(
      repository.commitChoice({
        runId: run.runId,
        operationId: 'op-stale',
        expectedSequence: 0,
        expectedNodeId: run.activeNodeId,
        choiceId: 'story.asya.seven-minutes.choice.open.2',
      }),
    ).rejects.toMatchObject({ code: 'SEQUENCE_CONFLICT' })
    expect((await repository.getRun(run.runId))?.events).toHaveLength(1)
  })

  it('persists and clears a provisional choice', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, { now })
    const run = await repository.createRun('story.dina.three-knocks')
    await repository.setProvisional({
      runId: run.runId,
      nodeId: run.activeNodeId,
      choiceId: 'story.dina.three-knocks.choice.open.1',
      createdAt: now(),
      expiresAt: '2026-08-13T08:00:03.000Z',
    })
    expect((await repository.getSnapshot()).provisional?.choiceId).toContain(
      'choice.open.1',
    )
    await repository.clearProvisional(run.runId)
    expect((await repository.getSnapshot()).provisional).toBeNull()
  })

  it('uses a declared safe route for a high-severity scene', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, { now })
    const run = await repository.createRun('story.dina.three-knocks', {
      safeRouteWarningId: 'warning.dina.frightening',
    })

    expect(run.status).toBe('completed')
    expect(run.activeNodeId).toBe('story.dina.three-knocks.ending.4.4')
    expect(run.state.memories['memory.dina.usedSafeRoute']).toBe(true)
  })

  it('enforces the product limit of ten active branches per story', async () => {
    let id = 0
    const repository = new MemoryAppRepository(sampleContentPackage, {
      now,
      createId: () => `run-${++id}`,
    })
    for (let index = 0; index < 10; index += 1) {
      await repository.createRun('story.ira.after-deadline')
    }

    await expect(
      repository.createRun('story.ira.after-deadline'),
    ).rejects.toEqual(
      new AppCoreError(
        'RUN_LIMIT',
        'Для одной истории можно вести не больше 10 активных веток.',
      ),
    )

    await expect(
      repository.createRun('story.asya.seven-minutes'),
    ).resolves.toMatchObject({ storyId: 'story.asya.seven-minutes' })
  })

  it('starts new runs on the active build and resumes old runs on their exact build', async () => {
    const original = new MemoryAppRepository(sampleContentPackage, {
      now,
      createId: () => 'run-original',
    })
    const oldRun = await original.createRun('story.ira.after-deadline')
    const updatedPackage = {
      ...sampleContentPackage,
      manifest: {
        ...sampleContentPackage.manifest,
        contentVersion: '1.2.0',
        buildId: 'ru-sample-2026.08.23.2',
      },
    }
    let created = 0
    const repository = new MemoryAppRepository(
      [sampleContentPackage, updatedPackage],
      {
        now,
        createId: () => `run-new-${++created}`,
        initialSnapshot: original.exportSnapshot(),
      },
    )

    const newRun = await repository.createRun('story.ira.after-deadline')
    expect(newRun.contentBuildId).toBe(updatedPackage.manifest.buildId)

    const resumed = await repository.commitChoice({
      runId: oldRun.runId,
      operationId: 'old-build-choice',
      expectedSequence: 0,
      expectedNodeId: oldRun.activeNodeId,
      choiceId: 'story.ira.after-deadline.choice.open.1',
    })
    expect(resumed.run.contentBuildId).toBe(
      sampleContentPackage.manifest.buildId,
    )
  })

  it('queues a privacy-minimized content report offline', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, {
      now,
      createId: () => 'report-1',
    })
    const report = await repository.submitContentReport({
      runId: null,
      nodeId: 'story.ira.after-deadline.decision.open',
      choiceId: null,
      contentBuildId: sampleContentPackage.manifest.buildId,
      appVersion: '1.0.0',
      platform: 'test',
      diagnosticCode: null,
      category: 'continuity',
      note: 'Повторяется факт.',
      uploadConsent: true,
    })

    expect(report).toMatchObject({
      reportId: 'report-1',
      status: 'queued',
      consentGrantedAt: now(),
    })
    expect((await repository.getSnapshot()).reports).toEqual([report])
    expect(JSON.stringify(report)).not.toContain('transcript')
  })

  it('requires explicit consent before queuing a content report', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, { now })

    await expect(
      repository.submitContentReport({
        runId: null,
        nodeId: null,
        choiceId: null,
        contentBuildId: sampleContentPackage.manifest.buildId,
        appVersion: '1.0.0',
        platform: 'test',
        diagnosticCode: null,
        category: 'technical',
        note: null,
        uploadConsent: false as true,
      }),
    ).rejects.toMatchObject({ code: 'REPORT_CONSENT_REQUIRED' })
  })

  it('marks a queued report sent idempotently', async () => {
    const repository = new MemoryAppRepository(sampleContentPackage, {
      now,
      createId: () => 'report-1',
    })
    await repository.submitContentReport({
      runId: null,
      nodeId: null,
      choiceId: null,
      contentBuildId: sampleContentPackage.manifest.buildId,
      appVersion: '1.0.0',
      platform: 'test',
      diagnosticCode: null,
      category: 'technical',
      note: null,
      uploadConsent: true,
    })

    await repository.markReportSent('report-1')
    await repository.markReportSent('report-1')

    expect((await repository.getSnapshot()).reports[0]?.status).toBe('sent')
  })

  it('rejects malformed content references before a run can be persisted', async () => {
    expect(() => new MemoryAppRepository([])).toThrow(
      'At least one content package is required',
    )

    const repository = new MemoryAppRepository(sampleContentPackage, { now })
    await expect(
      repository.updateProfile({ displayName: 'Нет профиля' }),
    ).rejects.toMatchObject({ code: 'PROFILE_NOT_FOUND' })
    await expect(repository.createRun('story.missing')).rejects.toMatchObject({
      code: 'STORY_NOT_FOUND',
    })
    await expect(
      repository.createRun('story.ira.after-deadline', {
        contentBuildId: 'missing-build',
      }),
    ).rejects.toMatchObject({ code: 'CONTENT_BUILD_NOT_FOUND' })
    await expect(
      repository.createRun('story.missing', {
        contentBuildId: sampleContentPackage.manifest.buildId,
      }),
    ).rejects.toMatchObject({ code: 'STORY_NOT_FOUND' })

    const missingEpisode = structuredClone(sampleContentPackage)
    const story = missingEpisode.stories.find(
      item => item.storyId === 'story.ira.after-deadline',
    )
    if (!story) throw new Error('fixture changed')
    story.episodeIds = ['episode.missing']
    await expect(
      new MemoryAppRepository(missingEpisode, { now }).createRun(story.storyId),
    ).rejects.toMatchObject({ code: 'EPISODE_NOT_FOUND' })

    const missingEntryNode = structuredClone(sampleContentPackage)
    const entryStory = missingEntryNode.stories.find(
      item => item.storyId === 'story.ira.after-deadline',
    )
    if (!entryStory) throw new Error('fixture changed')
    const episode = missingEntryNode.episodes.find(
      item => item.episodeId === entryStory.episodeIds[0],
    )
    if (!episode) throw new Error('fixture changed')
    missingEntryNode.nodes = missingEntryNode.nodes.filter(
      node => node.nodeId !== episode.entryNodeId,
    )
    await expect(
      new MemoryAppRepository(missingEntryNode, { now }).createRun(
        'story.ira.after-deadline',
      ),
    ).rejects.toMatchObject({ code: 'NODE_NOT_FOUND' })

    await expect(
      repository.createRun('story.dina.three-knocks', {
        safeRouteWarningId: 'warning.missing',
      }),
    ).rejects.toMatchObject({ code: 'SAFE_ROUTE_NOT_FOUND' })

    const brokenSafeRoute = structuredClone(sampleContentPackage)
    const warning = brokenSafeRoute.warnings.find(
      item => item.warningId === 'warning.dina.frightening',
    )
    if (!warning?.safeRoute) throw new Error('fixture changed')
    warning.safeRoute.nextNodeId = 'node.missing'
    await expect(
      new MemoryAppRepository(brokenSafeRoute, { now }).createRun(
        'story.dina.three-knocks',
        { safeRouteWarningId: warning.warningId },
      ),
    ).rejects.toMatchObject({ code: 'NODE_NOT_FOUND' })
  })

  it('defends every run lifecycle mutation boundary', async () => {
    let id = 0
    const repository = new MemoryAppRepository(sampleContentPackage, {
      now,
      createId: () => `lifecycle-${++id}`,
    })
    const run = await repository.createRun('story.ira.after-deadline')

    await repository.setTranscriptAnchor(run.runId, 'entry-1')
    expect(await repository.getTranscriptAnchor(run.runId)).toBe('entry-1')
    await repository.setTranscriptAnchor(run.runId, null)
    expect(await repository.getTranscriptAnchor(run.runId)).toBeNull()
    await repository.updateSettings({ reduceMotion: true, textScale: 'large' })
    expect((await repository.getSnapshot()).settings).toMatchObject({
      reduceMotion: true,
      textScale: 'large',
    })
    await repository.registerContentPackage(
      structuredClone(sampleContentPackage),
    )

    await expect(repository.forkRun('run.missing', 0)).rejects.toMatchObject({
      code: 'RUN_NOT_FOUND',
    })
    await expect(repository.forkRun(run.runId, 0.5)).rejects.toMatchObject({
      code: 'INVALID_BRANCH_POINT',
    })
    await expect(
      repository.renameRun('run.missing', 'Имя'),
    ).rejects.toMatchObject({ code: 'RUN_NOT_FOUND' })
    await expect(repository.deleteRun('run.missing')).rejects.toMatchObject({
      code: 'RUN_NOT_FOUND',
    })
    await expect(repository.archiveRun('run.missing')).rejects.toMatchObject({
      code: 'RUN_NOT_FOUND',
    })
    await expect(
      repository.setProvisional({
        runId: 'run.missing',
        nodeId: run.activeNodeId,
        choiceId: 'choice.missing',
        createdAt: now(),
        expiresAt: now(),
      }),
    ).rejects.toMatchObject({ code: 'RUN_NOT_FOUND' })
    await expect(
      repository.setProvisional({
        runId: run.runId,
        nodeId: 'node.stale',
        choiceId: 'choice.missing',
        createdAt: now(),
        expiresAt: now(),
      }),
    ).rejects.toMatchObject({ code: 'NODE_CONFLICT' })
    await expect(
      repository.commitChoice({
        runId: 'run.missing',
        operationId: 'missing-run',
        expectedSequence: 0,
        expectedNodeId: run.activeNodeId,
        choiceId: 'choice.missing',
      }),
    ).rejects.toMatchObject({ code: 'RUN_NOT_FOUND' })
    await expect(
      repository.commitChoice({
        runId: run.runId,
        operationId: 'stale-node',
        expectedSequence: 0,
        expectedNodeId: 'node.stale',
        choiceId: 'choice.missing',
      }),
    ).rejects.toMatchObject({ code: 'NODE_CONFLICT' })

    await repository.renameRun(run.runId, '   ')
    expect((await repository.getRun(run.runId))?.label).toBeUndefined()
    await repository.clearProvisional('another-run')
    const branch = await repository.forkRun(run.runId, 0)
    await repository.deleteRun(run.runId)
    expect((await repository.getRun(branch.runId))?.parentRunId).toBeUndefined()
    await repository.archiveRun(branch.runId)
    expect((await repository.getRun(branch.runId))?.status).toBe('archived')

    await repository.deleteAllLocalData()
    expect((await repository.getSnapshot()).runs).toEqual([])
  })

  it('rejects replaying a run when its exact content build is unavailable', async () => {
    const original = new MemoryAppRepository(sampleContentPackage, {
      now,
      createId: () => 'old-run',
    })
    const run = await original.createRun('story.ira.after-deadline')
    const replacement = structuredClone(sampleContentPackage)
    replacement.manifest.buildId = 'replacement-build'
    replacement.manifest.contentVersion = '9.0.0'
    const repository = new MemoryAppRepository(replacement, {
      now,
      initialSnapshot: original.exportSnapshot(),
    })

    await expect(repository.forkRun(run.runId, 0)).rejects.toMatchObject({
      code: 'CONTENT_BUILD_NOT_FOUND',
    })
    await expect(
      repository.commitChoice({
        runId: run.runId,
        operationId: 'missing-build',
        expectedSequence: 0,
        expectedNodeId: run.activeNodeId,
        choiceId: 'story.ira.after-deadline.choice.open.1',
      }),
    ).rejects.toMatchObject({ code: 'CONTENT_BUILD_NOT_FOUND' })
  })
})

describe('DurableAppRepository', () => {
  it('hydrates state in a new repository instance', async () => {
    let persisted: AppSnapshot | null = null
    const store: SnapshotStore = {
      read: async () => persisted,
      transact: async mutation => {
        const result = await mutation(persisted)
        persisted = result.snapshot
        return result.value
      },
      clear: async () => {
        persisted = null
      },
    }
    const first = new DurableAppRepository(sampleContentPackage, store, { now })
    await first.completeOnboarding({
      displayName: 'Мира',
      selectedCharacterId: 'char.asya',
    })
    const run = await first.createRun('story.asya.seven-minutes')

    const reopened = new DurableAppRepository(sampleContentPackage, store, {
      now,
    })
    expect((await reopened.getSnapshot()).profile?.displayName).toBe('Мира')
    expect((await reopened.getRun(run.runId))?.activeNodeId).toBe(
      run.activeNodeId,
    )
  })

  it('persists a stable transcript entry anchor without rewriting the snapshot', async () => {
    let persisted: AppSnapshot | null = null
    const anchors = new Map<string, string>()
    let snapshotTransactions = 0
    const store: SnapshotStore = {
      read: async () => persisted,
      transact: async mutation => {
        snapshotTransactions += 1
        const result = await mutation(persisted)
        persisted = result.snapshot
        return result.value
      },
      clear: async () => {
        persisted = null
        anchors.clear()
      },
      readTranscriptAnchor: async runId => anchors.get(runId) ?? null,
      writeTranscriptAnchor: async (runId, entryId) => {
        if (entryId) anchors.set(runId, entryId)
        else anchors.delete(runId)
      },
    }
    const repository = new DurableAppRepository(sampleContentPackage, store, {
      now,
    })

    await repository.setTranscriptAnchor('run-1', 'entry-4999')

    const reopened = new DurableAppRepository(sampleContentPackage, store, {
      now,
    })
    expect(await reopened.getTranscriptAnchor('run-1')).toBe('entry-4999')
    expect(snapshotTransactions).toBe(0)
    await reopened.setTranscriptAnchor('run-1', null)
    expect(await reopened.getTranscriptAnchor('run-1')).toBeNull()
  })

  it('provides a safe in-process transcript-anchor fallback for simple stores', async () => {
    let persisted: AppSnapshot | null = null
    const store: SnapshotStore = {
      read: async () => persisted,
      transact: async mutation => {
        const result = await mutation(persisted)
        persisted = result.snapshot
        return result.value
      },
      clear: async () => {
        persisted = null
      },
    }
    const repository = new DurableAppRepository(sampleContentPackage, store, {
      now,
    })

    expect(await repository.getTranscriptAnchor('run-1')).toBeNull()
    await repository.setTranscriptAnchor('run-1', 'entry-1')
    expect(await repository.getTranscriptAnchor('run-1')).toBe('entry-1')
    await repository.setTranscriptAnchor('run-1', null)
    expect(await repository.getTranscriptAnchor('run-1')).toBeNull()
    await repository.setTranscriptAnchor('run-1', 'entry-2')
    await repository.deleteAllLocalData()
    expect(await repository.getTranscriptAnchor('run-1')).toBeNull()
  })

  it('recovers coherently at every provisional and commit interruption boundary', async () => {
    let persisted: AppSnapshot | null = null
    let failure: 'before-commit' | 'after-commit' | null = null
    const store: SnapshotStore = {
      read: async () => persisted,
      transact: async mutation => {
        const result = await mutation(persisted)
        if (failure === 'before-commit') {
          failure = null
          throw new Error('simulated crash before durable commit')
        }
        persisted = result.snapshot
        if (failure === 'after-commit') {
          failure = null
          throw new Error('simulated crash after durable commit')
        }
        return result.value
      },
      clear: async () => {
        persisted = null
      },
    }
    const open = () =>
      new DurableAppRepository(sampleContentPackage, store, { now })
    const first = open()
    const run = await first.createRun('story.ira.after-deadline')
    const provisional = {
      runId: run.runId,
      nodeId: run.activeNodeId,
      choiceId: 'story.ira.after-deadline.choice.open.1',
      createdAt: now(),
      expiresAt: '2026-08-13T08:00:03.000Z',
    }
    await first.setProvisional(provisional)

    const afterTap = open()
    expect((await afterTap.getSnapshot()).provisional).toEqual(provisional)
    expect((await afterTap.getRun(run.runId))?.events).toHaveLength(0)

    const request = {
      runId: run.runId,
      operationId: 'recoverable-operation',
      expectedSequence: 0,
      expectedNodeId: run.activeNodeId,
      choiceId: provisional.choiceId,
    }
    failure = 'before-commit'
    await expect(afterTap.commitChoice(request)).rejects.toThrow(
      'before durable commit',
    )
    const afterFailedCommit = open()
    expect((await afterFailedCommit.getSnapshot()).provisional).toEqual(
      provisional,
    )
    expect((await afterFailedCommit.getRun(run.runId))?.events).toHaveLength(0)

    failure = 'after-commit'
    await expect(afterFailedCommit.commitChoice(request)).rejects.toThrow(
      'after durable commit',
    )
    const afterAmbiguousCommit = open()
    const retry = await afterAmbiguousCommit.commitChoice(request)
    const recovered = await afterAmbiguousCommit.getRun(run.runId)

    expect(retry.event.operationId).toBe(request.operationId)
    expect(recovered?.sequence).toBe(1)
    expect(recovered?.events).toHaveLength(1)
    expect(
      recovered?.transcript.filter(entry => entry.speakerId === 'player'),
    ).toHaveLength(1)
    expect((await afterAmbiguousCommit.getSnapshot()).provisional).toBeNull()
  })

  it('persists the complete reader lifecycle through the durable adapter', async () => {
    let persisted: AppSnapshot | null = null
    let clearCalls = 0
    let id = 0
    const store: SnapshotStore = {
      read: async () => persisted,
      transact: async mutation => {
        const result = await mutation(persisted)
        persisted = result.snapshot
        return result.value
      },
      clear: async () => {
        clearCalls += 1
        persisted = null
      },
    }
    const repository = new DurableAppRepository(sampleContentPackage, store, {
      now,
      createId: () => `durable-${++id}`,
    })
    const updatedContent = structuredClone(sampleContentPackage)
    updatedContent.manifest.buildId = 'durable-content-v2'
    updatedContent.manifest.contentVersion = '2.0.0'

    await repository.completeOnboarding({
      displayName: '  Ира  ',
      selectedCharacterId: 'char.ira',
    })
    await repository.updateProfile({
      displayName: 'Ирина',
      grammarProfile: 'feminine',
    })
    await repository.updateSettings({
      textScale: 'extraLarge',
      reduceMotion: true,
    })
    await repository.registerContentPackage(updatedContent)
    await repository.registerContentPackage(structuredClone(updatedContent))
    const run = await repository.createRun('story.ira.after-deadline', {
      label: 'Основная ветка',
    })
    await repository.setProvisional({
      runId: run.runId,
      nodeId: run.activeNodeId,
      choiceId: 'story.ira.after-deadline.choice.open.1',
      createdAt: now(),
      expiresAt: '2026-08-13T08:00:03.000Z',
    })
    await repository.clearProvisional(run.runId)
    const branch = await repository.forkRun(run.runId, 0, 'Альтернатива')
    await repository.renameRun(branch.runId, 'Новая альтернатива')
    const report = await repository.submitContentReport({
      runId: run.runId,
      nodeId: run.activeNodeId,
      choiceId: null,
      contentBuildId: run.contentBuildId,
      appVersion: '1.0.0',
      platform: 'test',
      diagnosticCode: null,
      category: 'technical',
      note: 'Проверка очереди',
      uploadConsent: true,
    })
    await repository.markReportSent(report.reportId)
    await repository.archiveRun(run.runId)
    await repository.setTranscriptAnchor(branch.runId, 'entry-1')
    await repository.deleteRun(branch.runId)

    const reopened = new DurableAppRepository(updatedContent, store, { now })
    const snapshot = await reopened.getSnapshot()
    expect(snapshot.profile).toMatchObject({
      displayName: 'Ирина',
      grammarProfile: 'feminine',
    })
    expect(snapshot.settings).toMatchObject({
      textScale: 'extraLarge',
      reduceMotion: true,
    })
    expect(snapshot.runs).toHaveLength(1)
    expect(snapshot.runs[0]?.status).toBe('archived')
    expect(snapshot.reports[0]?.status).toBe('sent')
    expect(await repository.getTranscriptAnchor(branch.runId)).toBeNull()

    await repository.deleteAllLocalData()
    expect(clearCalls).toBe(1)
    expect((await repository.getSnapshot()).runs).toEqual([])
  })
})
