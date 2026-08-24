import { sampleContentPackage } from '@razvilka/test-fixtures'
import { describe, expect, it } from 'vitest'

import { collectAnnotatedTextUnits, grammarPreviewRows } from './text-preview'

describe('content studio text previews', () => {
  it('renders every supported grammatical profile without leaving placeholders', () => {
    const rows = grammarPreviewRows(
      'Слушай, {{name}}. Ты {{form:пришёл|пришла|пришли}} вовремя.',
      'Лена',
    )

    expect(rows).toEqual([
      {
        profile: 'masculine',
        label: 'Мужской',
        text: 'Слушай, Лена. Ты пришёл вовремя.',
        unresolvedTokens: [],
      },
      {
        profile: 'feminine',
        label: 'Женский',
        text: 'Слушай, Лена. Ты пришла вовремя.',
        unresolvedTokens: [],
      },
      {
        profile: 'neutral',
        label: 'Нейтральный',
        text: 'Слушай, Лена. Ты пришли вовремя.',
        unresolvedTokens: [],
      },
    ])
  })

  it('reports unresolved template tokens instead of silently publishing them', () => {
    const [row] = grammarPreviewRows('Привет, {{unknown}}!', 'Лена')

    expect(row?.text).toBe('Привет, {{unknown}}!')
    expect(row?.unresolvedTokens).toEqual(['{{unknown}}'])
  })

  it('collects intentional repetition and typo annotations from authored units', () => {
    const content = structuredClone(sampleContentPackage)
    const decision = content.nodes.find(node => node.type === 'decision')
    if (!decision || decision.type !== 'decision') throw new Error('fixture')
    const message = decision.messageVariants[0]?.messages[0]
    const choice = decision.choiceSlots[0]?.candidates[0]
    if (!message || !choice) throw new Error('fixture')
    message.intentionalRepeatId = 'repeat.greeting'
    choice.intentionalTypo = true

    const units = collectAnnotatedTextUnits(content)
    expect(units.find(unit => unit.unitId === message.messageId)).toMatchObject(
      {
        intentionalRepeatId: 'repeat.greeting',
        intentionalTypo: false,
      },
    )
    expect(units.find(unit => unit.unitId === choice.choiceId)).toMatchObject({
      intentionalRepeatId: null,
      intentionalTypo: true,
    })
  })
})
