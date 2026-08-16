import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@chartalk/test-fixtures'

import {
  chooseInSimulator,
  createSimulator,
  createStudioState,
  canTransitionEditorialStatus,
  releaseReadiness,
  searchContent,
  securePublishBaseUrl,
  studioReducer,
} from './studio'

describe('studio domain', () => {
  it('permits HTTPS and loopback publishing endpoints only', () => {
    expect(securePublishBaseUrl('https://publisher.chartalk.app/')).toBe(
      'https://publisher.chartalk.app',
    )
    expect(securePublishBaseUrl('http://localhost:8787')).toBe(
      'http://localhost:8787',
    )
    expect(securePublishBaseUrl('http://publisher.chartalk.app')).toBeNull()
    expect(
      securePublishBaseUrl('https://admin:secret@publisher.chartalk.app'),
    ).toBeNull()
    expect(securePublishBaseUrl('not a URL')).toBeNull()
  })

  it('edits a message immutably', () => {
    const originalText =
      sampleContentPackage.nodes[0]?.type === 'decision'
        ? sampleContentPackage.nodes[0].messageVariants[0]?.messages[0]?.text
        : null
    const state = createStudioState(sampleContentPackage)
    const changed = studioReducer(state, {
      type: 'edit_message',
      nodeId: sampleContentPackage.nodes[0]!.nodeId,
      text: 'Новая проверочная реплика.',
    })

    expect(changed.dirty).toBe(true)
    expect(
      changed.content.nodes[0]?.type === 'decision' &&
        changed.content.nodes[0].messageVariants[0]?.messages[0]?.text,
    ).toBe('Новая проверочная реплика.')
    expect(
      sampleContentPackage.nodes[0]?.type === 'decision' &&
        sampleContentPackage.nodes[0].messageVariants[0]?.messages[0]?.text,
    ).toBe(originalText)
  })

  it('reopens approved content for continuity review after edits', () => {
    const approvedContent = structuredClone(sampleContentPackage)
    const approvedNode = approvedContent.nodes.find(
      node => node.type === 'decision',
    )!
    approvedNode.editorial.status = 'approved'
    const initial = createStudioState(approvedContent)

    const messageEdited = studioReducer(initial, {
      type: 'edit_message',
      nodeId: approvedNode.nodeId,
      text: 'Изменённая одобренная реплика.',
    })
    expect(
      messageEdited.content.nodes.find(
        node => node.nodeId === approvedNode.nodeId,
      )?.editorial.status,
    ).toBe('continuity-review')

    const choiceEdited = studioReducer(initial, {
      type: 'edit_choice',
      nodeId: approvedNode.nodeId,
      choiceId: approvedNode.choiceSlots[0]!.candidates[0]!.choiceId,
      text: 'Изменённый одобренный вариант.',
    })
    expect(
      choiceEdited.content.nodes.find(
        node => node.nodeId === approvedNode.nodeId,
      )?.editorial.status,
    ).toBe('continuity-review')

    for (const status of ['scheduled', 'published'] as const) {
      const immutableContent = structuredClone(sampleContentPackage)
      const immutableNode = immutableContent.nodes.find(
        node => node.type === 'decision',
      )!
      immutableNode.editorial.status = status
      const reopened = studioReducer(createStudioState(immutableContent), {
        type: 'edit_message',
        nodeId: immutableNode.nodeId,
        text: `Изменение после статуса ${status}.`,
      })
      expect(
        reopened.content.nodes.find(
          node => node.nodeId === immutableNode.nodeId,
        )?.editorial.status,
      ).toBe('continuity-review')
    }
  })

  it('records an immutable editorial audit entry for a message change', () => {
    const state = createStudioState(sampleContentPackage)
    const node = state.content.nodes.find(item => item.type === 'decision')!
    const previousText =
      node.type === 'decision'
        ? node.messageVariants[0]?.messages[0]?.text
        : undefined

    const changed = studioReducer(state, {
      type: 'edit_message',
      nodeId: node.nodeId,
      text: 'Новая реплика с объяснением изменения.',
      audit: {
        auditId: 'audit-001',
        actorId: 'editor.anna',
        reason: 'Уточнить формулировку после проверки голоса.',
        at: '2026-08-14T10:00:00.000Z',
      },
    })

    expect(changed.auditLog).toHaveLength(1)
    expect(changed.auditLog[0]).toMatchObject({
      auditId: 'audit-001',
      actorId: 'editor.anna',
      action: 'edit-message',
      field: 'message',
      nodeId: node.nodeId,
      before: previousText,
      after: 'Новая реплика с объяснением изменения.',
      reason: 'Уточнить формулировку после проверки голоса.',
      at: '2026-08-14T10:00:00.000Z',
    })
    expect(state.auditLog).toEqual([])
  })

  it('audits status and choice changes, but ignores no-op or blocked actions', () => {
    const content = structuredClone(sampleContentPackage)
    const node = content.nodes.find(item => item.type === 'decision')!
    node.editorial.status = 'draft'
    const state = createStudioState(content)

    const voiceReview = studioReducer(state, {
      type: 'set_editorial_status',
      nodeId: node.nodeId,
      status: 'voice-review',
      audit: {
        auditId: 'audit-status',
        actorId: 'editor.oleg',
        reason: 'Передать реплику на проверку голоса.',
        at: '2026-08-14T10:01:00.000Z',
      },
    })
    const choice = node.choiceSlots[0]!.candidates[0]!
    const choiceEdited = studioReducer(voiceReview, {
      type: 'edit_choice',
      nodeId: node.nodeId,
      choiceId: choice.choiceId,
      text: 'Обновлённый вариант выбора.',
      audit: {
        auditId: 'audit-choice',
        actorId: 'editor.oleg',
        reason: 'Сделать намерение выбора однозначным.',
        at: '2026-08-14T10:02:00.000Z',
      },
    })

    expect(choiceEdited.auditLog.map(entry => entry.action)).toEqual([
      'status-change',
      'edit-choice',
    ])
    expect(choiceEdited.auditLog[1]).toMatchObject({
      field: 'choice',
      choiceId: choice.choiceId,
      before: choice.text,
      after: 'Обновлённый вариант выбора.',
    })

    const noOp = studioReducer(choiceEdited, {
      type: 'edit_choice',
      nodeId: node.nodeId,
      choiceId: choice.choiceId,
      text: 'Обновлённый вариант выбора.',
    })
    expect(noOp).toBe(choiceEdited)

    const blocked = studioReducer(choiceEdited, {
      type: 'set_editorial_status',
      nodeId: node.nodeId,
      status: 'approved',
    })
    expect(blocked).toBe(choiceEdited)
  })

  it('marks intentional repetition and typos without changing authored text', () => {
    const state = createStudioState(sampleContentPackage)
    const node = state.content.nodes.find(item => item.type === 'decision')!
    if (node.type !== 'decision') throw new Error('fixture')
    const message = node.messageVariants[0]?.messages[0]
    const choice = node.choiceSlots[0]?.candidates[0]
    if (!message || !choice) throw new Error('fixture')

    const marked = studioReducer(state, {
      type: 'set_text_annotation',
      nodeId: node.nodeId,
      unitId: message.messageId,
      annotation: { intentionalRepeatId: 'repeat.greeting' },
      audit: {
        auditId: 'audit-annotation-1',
        actorId: 'editor.ira',
        reason: 'Оставить повтор как намеренный мотив.',
        at: '2026-08-14T10:04:00.000Z',
      },
    })
    const typoMarked = studioReducer(marked, {
      type: 'set_text_annotation',
      nodeId: node.nodeId,
      unitId: choice.choiceId,
      annotation: { intentionalTypo: true },
    })

    const updated = typoMarked.content.nodes.find(
      item => item.nodeId === node.nodeId,
    )!
    expect(
      updated.type === 'decision' && updated.messageVariants[0]?.messages[0],
    ).toMatchObject({
      messageId: message.messageId,
      text: message.text,
      intentionalRepeatId: 'repeat.greeting',
      intentionalTypo: false,
    })
    expect(
      updated.type === 'decision' && updated.choiceSlots[0]?.candidates[0],
    ).toMatchObject({
      choiceId: choice.choiceId,
      text: choice.text,
      intentionalTypo: true,
    })
    expect(
      updated.type === 'decision' &&
        updated.choiceSlots[0]?.candidates[0]?.intentionalRepeatId,
    ).toBeUndefined()
    expect(typoMarked.auditLog.map(entry => entry.action)).toEqual([
      'annotation-change',
      'annotation-change',
    ])
  })

  it('preserves audit history when importing a replacement package', () => {
    const state = createStudioState(sampleContentPackage, {
      actorId: 'editor.ira',
      auditLog: [
        {
          auditId: 'audit-existing',
          actorId: 'editor.ira',
          action: 'edit-message',
          field: 'message',
          nodeId: sampleContentPackage.nodes[0]!.nodeId,
          before: 'до',
          after: 'после',
          reason: 'Проверка импорта.',
          at: '2026-08-14T09:00:00.000Z',
        },
      ],
    })
    const imported = structuredClone(sampleContentPackage)
    imported.manifest.buildId = 'build.imported'

    const replaced = studioReducer(state, {
      type: 'replace_content',
      content: imported,
      audit: {
        auditId: 'audit-import',
        actorId: 'editor.ira',
        reason: 'Загрузить пакет из локального архива.',
        at: '2026-08-14T10:03:00.000Z',
      },
    })

    expect(replaced.dirty).toBe(false)
    expect(replaced.actorId).toBe('editor.ira')
    expect(replaced.auditLog).toHaveLength(2)
    expect(replaced.auditLog[1]).toMatchObject({
      action: 'replace-content',
      field: 'content',
      before: sampleContentPackage.manifest.buildId,
      after: 'build.imported',
    })
  })

  it('normalizes operator context and bounds the audit log', () => {
    const initial = createStudioState(sampleContentPackage, {
      actorId: '  editor.ira  ',
    })
    expect(initial.actorId).toBe('editor.ira')

    const node = initial.content.nodes.find(item => item.type === 'decision')!
    let state = initial
    for (let index = 0; index < 505; index += 1) {
      state = studioReducer(state, {
        type: 'edit_message',
        nodeId: node.nodeId,
        text: `Реплика ${index}`,
        audit: {
          actorId: 'editor.ira',
          reason: 'Проверка ограничения журнала.',
          at: `2026-08-14T10:${String(index).padStart(2, '0')}:00.000Z`,
        },
      })
    }

    expect(state.auditLog).toHaveLength(500)
    expect(state.auditLog[0]?.after).toBe('Реплика 5')
    expect(state.auditLog.at(-1)?.after).toBe('Реплика 504')
  })

  it('searches IDs and Russian narrative text', () => {
    expect(
      searchContent(sampleContentPackage, 'семь минут').some(
        result => result.kind === 'story',
      ),
    ).toBe(true)
    expect(
      searchContent(sampleContentPackage, 'decision.open').some(
        result => result.kind === 'node',
      ),
    ).toBe(true)
    expect(searchContent(sampleContentPackage, '   ')).toEqual([])
    expect(
      searchContent(sampleContentPackage, 'Ира').some(
        result => result.kind === 'character',
      ),
    ).toBe(true)
  })

  it('searches editorial owners, intents, statuses, and effect paths', () => {
    expect(
      searchContent(sampleContentPackage, 'fixture.generated').some(
        result => result.kind === 'node',
      ),
    ).toBe(true)
    expect(
      searchContent(sampleContentPackage, 'listen').some(
        result => result.kind === 'node',
      ),
    ).toBe(true)
    expect(
      searchContent(sampleContentPackage, 'memories').some(
        result => result.kind === 'node',
      ),
    ).toBe(true)
    expect(
      searchContent(sampleContentPackage, 'fixture').some(
        result => result.kind === 'node',
      ),
    ).toBe(true)
  })

  it('searches history-aware conditions and structured effect metadata', () => {
    const content = structuredClone(sampleContentPackage)
    const decision = content.nodes.find(node => node.type === 'decision')
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.messageVariants.push(
      {
        variantId: 'variant.search-memory',
        priority: 20,
        when: { op: 'hasMemory', key: 'memory.search', value: true },
        messages: [
          {
            messageId: 'message.search-memory',
            speakerId: 'char.ira',
            text: 'Память поиска.',
            delayMs: 0,
            kind: 'message',
          },
        ],
      },
      {
        variantId: 'variant.search-history',
        priority: 19,
        when: { op: 'chosen', choiceId: 'choice.search' },
        messages: [
          {
            messageId: 'message.search-history',
            speakerId: 'char.ira',
            text: 'История поиска.',
            delayMs: 0,
            kind: 'message',
          },
        ],
      },
      {
        variantId: 'variant.search-seen',
        priority: 18,
        when: { op: 'seen', nodeId: 'node.search' },
        messages: [
          {
            messageId: 'message.search-seen',
            speakerId: 'char.ira',
            text: 'Видимый поиск.',
            delayMs: 0,
            kind: 'message',
          },
        ],
      },
      {
        variantId: 'variant.search-window',
        priority: 17,
        when: {
          op: 'withinLastTurns',
          choiceId: 'choice.window',
          turns: 2,
        },
        messages: [
          {
            messageId: 'message.search-window',
            speakerId: 'char.ira',
            text: 'Окно поиска.',
            delayMs: 0,
            kind: 'message',
          },
        ],
      },
    )
    decision.choiceSlots[0]!.candidates[0]!.effects.push(
      {
        effectId: 'search.add-memory',
        op: 'addMemory',
        key: 'memory.search',
        value: true,
      },
      {
        effectId: 'search.add-promise',
        op: 'addPromise',
        promiseId: 'promise.search',
      },
      {
        effectId: 'search.resolve-promise',
        op: 'resolvePromise',
        promiseId: 'promise.search',
        outcome: 'kept',
      },
      {
        effectId: 'search.advance-arc',
        op: 'advanceArc',
        arcId: 'arc.search',
        phase: 'phase-2',
      },
      {
        effectId: 'search.cooldown',
        op: 'startCooldown',
        cooldownId: 'cooldown.search',
        turns: 2,
      },
    )

    expect(searchContent(content, 'memory.search')).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'node' })]),
    )
    expect(searchContent(content, 'choice.search')).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'node' })]),
    )
    expect(searchContent(content, 'node.search')).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'node' })]),
    )
    expect(searchContent(content, 'withinLastTurns')).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'node' })]),
    )
    expect(searchContent(content, 'promise.search')).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'node' })]),
    )
    expect(searchContent(content, 'arc.search')).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'node' })]),
    )
    expect(searchContent(content, 'cooldown.search')).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: 'node' })]),
    )
  })

  it('handles the complete editor reducer lifecycle and node variants', () => {
    const initial = createStudioState(sampleContentPackage)
    const reaction = sampleContentPackage.nodes.find(
      node => node.type === 'reaction',
    )!
    const ending = sampleContentPackage.nodes.find(
      node => node.type === 'ending',
    )!

    const selected = studioReducer(initial, {
      type: 'select_node',
      nodeId: reaction.nodeId,
    })
    expect(selected.selectedNodeId).toBe(reaction.nodeId)
    expect(selected.view).toBe('content')
    expect(
      studioReducer(selected, { type: 'set_query', query: 'Ира' }).query,
    ).toBe('Ира')
    expect(
      studioReducer(selected, { type: 'set_view', view: 'release' }).view,
    ).toBe('release')

    const reactionEdited = studioReducer(initial, {
      type: 'edit_message',
      nodeId: reaction.nodeId,
      text: 'Отредактированная реакция.',
    })
    const editedReaction = reactionEdited.content.nodes.find(
      node => node.nodeId === reaction.nodeId,
    )
    expect(
      editedReaction?.type === 'reaction'
        ? editedReaction.messages[0]?.text
        : null,
    ).toBe('Отредактированная реакция.')

    const noMessageEdit = studioReducer(initial, {
      type: 'edit_message',
      nodeId: ending.nodeId,
      text: 'Не должно появиться',
    })
    expect(
      noMessageEdit.content.nodes.find(node => node.nodeId === ending.nodeId),
    ).toEqual(ending)

    const nonDecisionChoiceEdit = studioReducer(initial, {
      type: 'edit_choice',
      nodeId: reaction.nodeId,
      choiceId: 'missing-choice',
      text: 'Не должно появиться',
    })
    expect(
      nonDecisionChoiceEdit.content.nodes.find(
        node => node.nodeId === reaction.nodeId,
      ),
    ).toEqual(reaction)

    const reviewed = studioReducer(initial, {
      type: 'set_editorial_status',
      nodeId: reaction.nodeId,
      status: 'approved',
    })
    expect(
      reviewed.content.nodes.find(node => node.nodeId === reaction.nodeId)
        ?.editorial.status,
    ).toBe('fixture')

    const saved = studioReducer(reviewed, {
      type: 'mark_saved',
      at: '2026-08-13T10:00:00.000Z',
    })
    expect(saved).toMatchObject({
      dirty: false,
      lastSavedAt: '2026-08-13T10:00:00.000Z',
    })
    expect(
      studioReducer(saved, {
        type: 'replace_content',
        content: sampleContentPackage,
      }).dirty,
    ).toBe(false)
  })

  it('enforces the editorial workflow and keeps fixture nodes unapprovable', () => {
    expect(canTransitionEditorialStatus('draft', 'voice-review')).toBe(true)
    expect(canTransitionEditorialStatus('draft', 'approved')).toBe(false)
    expect(canTransitionEditorialStatus('qa', 'approved')).toBe(true)
    expect(canTransitionEditorialStatus('fixture', 'approved')).toBe(false)

    const draftContent = structuredClone(sampleContentPackage)
    const draftNode = draftContent.nodes[0]!
    draftNode.editorial.status = 'draft'
    const draftState = createStudioState(draftContent)
    const voiceReview = studioReducer(draftState, {
      type: 'set_editorial_status',
      nodeId: draftNode.nodeId,
      status: 'voice-review',
    })
    expect(voiceReview.content.nodes[0]?.editorial.status).toBe('voice-review')

    const skipped = studioReducer(voiceReview, {
      type: 'set_editorial_status',
      nodeId: draftNode.nodeId,
      status: 'approved',
    })
    expect(skipped).toBe(voiceReview)

    const fixtureState = createStudioState(sampleContentPackage)
    const fixtureAttempt = studioReducer(fixtureState, {
      type: 'set_editorial_status',
      nodeId: sampleContentPackage.nodes[0]!.nodeId,
      status: 'approved',
    })
    expect(fixtureAttempt).toBe(fixtureState)
  })

  it('supports every production review gate without allowing stage skips', () => {
    const workflow: Array<[string, string]> = [
      ['outline', 'graph-ready'],
      ['graph-ready', 'draft'],
      ['draft', 'voice-review'],
      ['voice-review', 'continuity-review'],
      ['continuity-review', 'rating-review'],
      ['rating-review', 'logic-qa'],
      ['logic-qa', 'device-qa'],
      ['device-qa', 'approved'],
      ['approved', 'scheduled'],
      ['scheduled', 'published'],
      ['published', 'deprecated'],
    ]

    for (const [from, to] of workflow) {
      expect(canTransitionEditorialStatus(from as never, to as never)).toBe(
        true,
      )
    }
    expect(canTransitionEditorialStatus('outline', 'approved')).toBe(false)
    expect(canTransitionEditorialStatus('logic-qa', 'published')).toBe(false)
    expect(canTransitionEditorialStatus('fixture', 'outline')).toBe(false)
    expect(canTransitionEditorialStatus('deprecated', 'published')).toBe(false)

    const content = structuredClone(sampleContentPackage)
    const node = content.nodes[0]!
    node.editorial.status = 'outline'
    let state = createStudioState(content)
    for (const [, to] of workflow) {
      state = studioReducer(state, {
        type: 'set_editorial_status',
        nodeId: node.nodeId,
        status: to as never,
      })
    }
    expect(state.content.nodes[0]?.editorial.status).toBe('deprecated')
    expect(state.auditLog).toHaveLength(workflow.length)
  })

  it('simulates a complete two-choice path with the production engine', () => {
    const start = createSimulator(
      sampleContentPackage,
      'story.ira.after-deadline',
    )
    const afterFirst = chooseInSimulator(
      sampleContentPackage,
      start,
      start.choices[0]!.choiceId,
    )
    const complete = chooseInSimulator(
      sampleContentPackage,
      afterFirst,
      afterFirst.choices[2]!.choiceId,
    )

    expect(start.choices).toHaveLength(4)
    expect(afterFirst.sequence).toBe(1)
    expect(complete.status).toBe('completed')
    expect(complete.sequence).toBe(2)
    expect(chooseInSimulator(sampleContentPackage, complete, 'ignored')).toBe(
      complete,
    )
  })

  it('rejects missing stories and simulator states outside decisions', () => {
    expect(() =>
      createSimulator(sampleContentPackage, 'story.missing'),
    ).toThrow(/no playable decision entry/i)

    const simulator = createSimulator(
      sampleContentPackage,
      'story.ira.after-deadline',
    )
    const reaction = sampleContentPackage.nodes.find(
      node => node.type === 'reaction',
    )!
    expect(() =>
      chooseInSimulator(
        sampleContentPackage,
        { ...simulator, activeNodeId: reaction.nodeId },
        simulator.choices[0]!.choiceId,
      ),
    ).toThrow(/not at a decision/i)
  })

  it('keeps the generated fixture visibly blocked from release', () => {
    const readiness = releaseReadiness(sampleContentPackage)
    expect(readiness.ready).toBe(false)
    expect(readiness.nonApprovedNodes).toBeGreaterThan(0)
    expect(readiness.requiredApprovedTextUnits).toBe(300_000)
  })
})
