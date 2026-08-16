import { describe, expect, it } from 'vitest'

import {
  assertFourChoiceAccessibilityContract,
  boundsCenter,
  findAndroidUiNode,
  parseAndroidUiDump,
} from './android-release-smoke'

const choice = (position: number, enabled = true) =>
  `<node index="${position}" resource-id="choice-${position}" class="android.widget.Button" content-desc="Вариант ${position} из 4: Ответ ${position}" clickable="true" enabled="${enabled}" bounds="[${position * 10},100][${position * 10 + 100},200]" />`

describe('Android native smoke accessibility contract', () => {
  it('parses escaped attributes and calculates a tappable center', () => {
    const [node] = parseAndroidUiDump(
      '<hierarchy><node resource-id="choice-1" content-desc="Вариант 1 из 4: &quot;Да&quot;" class="android.widget.Button" clickable="true" enabled="true" bounds="[10,20][110,220]" /></hierarchy>',
    )

    expect(node).toMatchObject({
      resourceId: 'choice-1',
      contentDescription: 'Вариант 1 из 4: "Да"',
      className: 'android.widget.Button',
      clickable: true,
      enabled: true,
      bounds: { left: 10, top: 20, right: 110, bottom: 220 },
    })
    expect(boundsCenter(node!)).toEqual({ x: 60, y: 120 })
  })

  it('finds nodes by resource ID or exact/regex content description', () => {
    const nodes = parseAndroidUiDump(
      `<hierarchy>${choice(1)}<node resource-id="start-story" content-desc="Начать историю" class="android.widget.Button" clickable="true" enabled="true" bounds="[0,0][100,100]" /></hierarchy>`,
    )

    expect(
      findAndroidUiNode(nodes, { resourceId: 'start-story' }),
    ).toMatchObject({ contentDescription: 'Начать историю' })
    expect(
      findAndroidUiNode(nodes, { contentDescription: 'Начать историю' }),
    ).toBeDefined()
    expect(
      findAndroidUiNode(nodes, { contentDescription: /Вариант 1 из 4/ }),
    ).toMatchObject({ resourceId: 'choice-1' })
    expect(findAndroidUiNode(nodes, { text: 'missing' })).toBeUndefined()
  })

  it('accepts exactly four enabled, labeled, clickable choices', () => {
    const nodes = parseAndroidUiDump(
      `<hierarchy>${[1, 2, 3, 4].map(position => choice(position)).join('')}</hierarchy>`,
    )

    expect(assertFourChoiceAccessibilityContract(nodes)).toMatchObject({
      choiceIds: ['choice-1', 'choice-2', 'choice-3', 'choice-4'],
      labels: [
        'Вариант 1 из 4: Ответ 1',
        'Вариант 2 из 4: Ответ 2',
        'Вариант 3 из 4: Ответ 3',
        'Вариант 4 из 4: Ответ 4',
      ],
    })
  })

  it('rejects missing, disabled, or incorrectly announced choices', () => {
    const missing = parseAndroidUiDump(
      `<hierarchy>${[1, 2, 3].map(position => choice(position)).join('')}</hierarchy>`,
    )
    expect(() => assertFourChoiceAccessibilityContract(missing)).toThrow(
      /exactly four/i,
    )

    const disabled = parseAndroidUiDump(
      `<hierarchy>${[1, 2, 3, 4].map(position => choice(position, position !== 3)).join('')}</hierarchy>`,
    )
    expect(() => assertFourChoiceAccessibilityContract(disabled)).toThrow(
      /choice-3.*enabled/i,
    )

    const mislabeled = parseAndroidUiDump(
      `<hierarchy>${[1, 2, 3, 4].map(position => (position === 2 ? choice(position).replace('Вариант 2 из 4', 'Ответ 2') : choice(position))).join('')}</hierarchy>`,
    )
    expect(() => assertFourChoiceAccessibilityContract(mislabeled)).toThrow(
      /choice-2.*label/i,
    )
  })
})
