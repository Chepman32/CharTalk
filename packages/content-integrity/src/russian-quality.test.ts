import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@razvilka/test-fixtures'

import { auditRussianQuality, inspectRussianText } from './russian-quality'

describe('Russian editorial quality screen', () => {
  it('accepts contextual conversational Russian and idioms', () => {
    expect(
      inspectRussianText(
        'Не будем рубить с плеча — сверим факты. Если честно, разберёмся.',
        'fixture.choice',
      ),
    ).toEqual([])
  })

  it('flags slash gender forms, forced slang, therapy formulas, literal calques, and punctuation', () => {
    const issues = inspectRussianText(
      'Я понимаю твои чувства. Это вайб! Я ценю это — давай проверим, где мы стоим. Скажи, готов/готова ли ты??',
      'nodes.0.text',
    )

    expect(issues.map(issue => issue.code)).toEqual(
      expect.arrayContaining([
        'UNNATURAL_SLASH_FORM',
        'GENERIC_THERAPY_FORMULA',
        'FORCED_INTERNET_SLANG',
        'LITERAL_TRANSLATION',
        'REPEATED_PUNCTUATION',
      ]),
    )
    expect(issues.every(issue => issue.path === 'nodes.0.text')).toBe(true)
  })

  it('flags common case-governance mistakes in generated-style prose', () => {
    const issues = inspectRussianText(
      'Разберёмся с первой детали. После разговора о риска вернёмся к плану. Начнём с первую деталь.',
      'nodes.1.text',
    )

    expect(
      issues.filter(issue => issue.code === 'UNNATURAL_CASE_CONSTRUCTION'),
    ).toHaveLength(3)
  })

  it('flags generic support and boundary formulas from generated dialogue', () => {
    const issues = inspectRussianText(
      'Я рядом. Попробуем оставить себе безопасный следующий шаг вместе. Граница названа прямо; теперь разговор можно продолжить без давления. Оставим вопрос открытым и попробуем назвать границу.',
      'nodes.2.text',
    )

    expect(issues.some(issue => issue.code === 'GENERIC_THERAPY_FORMULA')).toBe(
      true,
    )
  })

  it('reports duplicate authored units without treating them as blockers', () => {
    const content = structuredClone(sampleContentPackage)
    const first = content.nodes.find(node => node.type === 'reaction')
    const second = content.nodes.find(
      node => node.type === 'reaction' && node.nodeId !== first?.nodeId,
    )
    if (
      !first ||
      first.type !== 'reaction' ||
      !second ||
      second.type !== 'reaction'
    ) {
      throw new Error('fixture changed')
    }
    const duplicate = first.messages[0]!.text
    second.messages[0]!.text = duplicate

    const report = auditRussianQuality(content)
    expect(report.textUnitCount).toBeGreaterThan(0)
    expect(
      report.issues.some(issue => issue.code === 'DUPLICATE_TEXT_UNIT'),
    ).toBe(true)
    expect(report.blockingIssueCount).toBe(0)
  })
})
