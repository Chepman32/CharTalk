import type {
  ChoiceCandidate,
  ContentAsset,
  ContentNode,
  ContentPackage,
  DecisionNode,
  NarrativeMessage,
} from '@chartalk/content-schema'

import {
  storyPreviewAssetIdFor,
  storyPreviewAssetsFor,
} from './story-previews.generated'

interface FollowUpBlueprint {
  text: string
  intent: string
  reaction: string
  endingTitle: string
  epilogue: string
}

interface BranchBlueprint {
  openingChoice: string
  openingIntent: string
  openingReaction: string
  prompt: string
  followUps: readonly [
    FollowUpBlueprint,
    FollowUpBlueprint,
    FollowUpBlueprint,
    FollowUpBlueprint,
  ]
}

interface StoryBlueprint {
  storyId: string
  characterId: string
  sceneId: string
  openingMessage: string
  openingAttachment?: {
    assetId: string
    altText: string
  }
  branches: readonly [
    BranchBlueprint,
    BranchBlueprint,
    BranchBlueprint,
    BranchBlueprint,
  ]
}

const SAMPLE_STORY_CHOICE_POINTS = 50

const continuationFrames = [
  'сверить новую деталь с исходными записями',
  'разделить факт и предположение',
  'найти независимое подтверждение',
  'оставить себе безопасный следующий шаг',
  'проверить, что не потерялось по дороге',
  'назвать границу до следующего разговора',
] as const

const continuationActions = [
  {
    text: (frame: string) => `Давай ${frame} и не будем спешить с выводом.`,
    intent: 'verify-continuation',
    reaction:
      'Хорошо. Я откладываю выводы и отмечаю, что именно нужно сверить.',
  },
  {
    text: (frame: string) =>
      `Сначала обозначим границу, а потом попробуем ${frame}.`,
    intent: 'set-continuation-boundary',
    reaction:
      'Граница названа прямо; теперь разговор можно продолжить без давления.',
  },
  {
    text: (frame: string) => `Я рядом. Попробуем ${frame} вместе.`,
    intent: 'support-continuation',
    reaction:
      'Она выдыхает и раскладывает следующий шаг так, чтобы не оставаться с ним одной.',
  },
  {
    text: (frame: string) => `Оставим вопрос открытым и попробуем ${frame}.`,
    intent: 'hold-continuation-question',
    reaction:
      'Версия остаётся версией, а в записях появляется конкретный план проверки.',
  },
] as const

const message = (
  messageId: string,
  speakerId: string,
  text: string,
  delayMs = 0,
): NarrativeMessage => ({
  messageId,
  speakerId,
  text,
  delayMs,
  kind: 'message',
})

function choice(
  choiceId: string,
  text: string,
  intent: string,
  nextNodeId: string,
  memoryValue: string,
): ChoiceCandidate {
  return {
    choiceId,
    text,
    intent,
    priority: 0,
    when: { op: 'all', args: [] },
    effects: [
      {
        effectId: `${choiceId}.memory`,
        op: 'setMemory',
        key: `${choiceId}.selected`,
        value: memoryValue,
      },
      {
        effectId: `${choiceId}.counter`,
        op: 'increment',
        path: `counters.intent.${intent}`,
        by: 1,
        min: 0,
        max: 100,
      },
    ],
    nextNodeId,
  }
}

function decision(
  nodeId: string,
  sceneId: string,
  speakerId: string,
  text: string,
  choices: readonly [
    ChoiceCandidate,
    ChoiceCandidate,
    ChoiceCandidate,
    ChoiceCandidate,
  ],
  checkpointPolicy: DecisionNode['checkpointPolicy'] = 'none',
  openingAttachment?: StoryBlueprint['openingAttachment'],
): DecisionNode {
  const slotNumbers = [1, 2, 3, 4] as const
  const opening = message(`${nodeId}.message`, speakerId, text, 220)
  if (openingAttachment) {
    opening.kind = 'image'
    opening.assetId = openingAttachment.assetId
    opening.altText = openingAttachment.altText
  }
  return {
    nodeId,
    type: 'decision',
    sceneId,
    onEnterEffects: [],
    messageVariants: [
      {
        variantId: `${nodeId}.default`,
        priority: 0,
        when: { op: 'all', args: [] },
        messages: [opening],
      },
    ],
    choiceSlots: choices.map((candidate, index) => ({
      slot: slotNumbers[index] ?? 1,
      candidates: [candidate],
    })),
    checkpointPolicy,
    editorial: fixtureEditorial(speakerId),
  }
}

function fixtureEditorial(speakerId: string): DecisionNode['editorial'] {
  return {
    writerId: 'fixture.generated.2026-08-13',
    voiceEditorId: 'fixture.not-human-approved',
    continuityEditorId: 'fixture.not-human-approved',
    status: 'fixture',
    voiceCardVersion: `${speakerId}.voice.fixture.1`,
    warningProfileId: null,
  }
}

function buildStoryNodes(blueprint: StoryBlueprint): ContentNode[] {
  const nodes: ContentNode[] = []
  const continuationDecisionId = (stage: number, branch: number) =>
    `${blueprint.storyId}.decision.continuation.${String(stage).padStart(2, '0')}.${branch + 1}`
  const continuationReactionId = (
    stage: number,
    branch: number,
    choiceIndex: number,
  ) =>
    `${blueprint.storyId}.reaction.continuation.${String(stage).padStart(2, '0')}.${branch + 1}.${choiceIndex + 1}`

  const rootChoices = blueprint.branches.map((branch, branchIndex) => {
    const number = branchIndex + 1
    return choice(
      `${blueprint.storyId}.choice.open.${number}`,
      branch.openingChoice,
      branch.openingIntent,
      `${blueprint.storyId}.reaction.open.${number}`,
      branch.openingIntent,
    )
  }) as [ChoiceCandidate, ChoiceCandidate, ChoiceCandidate, ChoiceCandidate]

  nodes.push(
    decision(
      `${blueprint.storyId}.decision.open`,
      blueprint.sceneId,
      blueprint.characterId,
      blueprint.openingMessage,
      rootChoices,
      'before',
      blueprint.openingAttachment,
    ),
  )

  blueprint.branches.forEach((branch, branchIndex) => {
    const branchNumber = branchIndex + 1
    const branchDecisionId = `${blueprint.storyId}.decision.branch.${branchNumber}`
    nodes.push({
      nodeId: `${blueprint.storyId}.reaction.open.${branchNumber}`,
      type: 'reaction',
      sceneId: blueprint.sceneId,
      messages: [
        message(
          `${blueprint.storyId}.reaction.open.${branchNumber}.message`,
          blueprint.characterId,
          branch.openingReaction,
          180,
        ),
      ],
      nextNodeId: branchDecisionId,
      effects: [],
      editorial: fixtureEditorial(blueprint.characterId),
    })

    const followUpChoices = branch.followUps.map((followUp, followUpIndex) => {
      const followUpNumber = followUpIndex + 1
      return choice(
        `${blueprint.storyId}.choice.${branchNumber}.${followUpNumber}`,
        followUp.text,
        followUp.intent,
        `${blueprint.storyId}.reaction.${branchNumber}.${followUpNumber}`,
        `${branch.openingIntent}:${followUp.intent}`,
      )
    }) as [ChoiceCandidate, ChoiceCandidate, ChoiceCandidate, ChoiceCandidate]

    nodes.push(
      decision(
        branchDecisionId,
        blueprint.sceneId,
        blueprint.characterId,
        branch.prompt,
        followUpChoices,
      ),
    )

    branch.followUps.forEach((followUp, followUpIndex) => {
      const followUpNumber = followUpIndex + 1
      nodes.push({
        nodeId: `${blueprint.storyId}.reaction.${branchNumber}.${followUpNumber}`,
        type: 'reaction',
        sceneId: blueprint.sceneId,
        messages: [
          message(
            `${blueprint.storyId}.reaction.${branchNumber}.${followUpNumber}.message`,
            blueprint.characterId,
            followUp.reaction,
            160,
          ),
        ],
        nextNodeId: continuationDecisionId(3, followUpIndex),
        effects: [],
        editorial: fixtureEditorial(blueprint.characterId),
      })
    })
  })

  for (let stage = 3; stage <= SAMPLE_STORY_CHOICE_POINTS; stage += 1) {
    for (let branchIndex = 0; branchIndex < 4; branchIndex += 1) {
      const branch = blueprint.branches[branchIndex]!
      const frame =
        continuationFrames[(stage + branchIndex) % continuationFrames.length]!
      const nodeId = continuationDecisionId(stage, branchIndex)
      const choiceCandidates = continuationActions.map(
        (action, choiceIndex) => {
          const isFinalChoicePoint = stage === SAMPLE_STORY_CHOICE_POINTS
          const nextNodeId = isFinalChoicePoint
            ? `${blueprint.storyId}.ending.${branchIndex + 1}.${choiceIndex + 1}`
            : continuationReactionId(stage, branchIndex, choiceIndex)
          return choice(
            `${blueprint.storyId}.choice.continuation.${String(stage).padStart(2, '0')}.${branchIndex + 1}.${choiceIndex + 1}`,
            action.text(frame),
            action.intent,
            nextNodeId,
            `${branch.openingIntent}:${stage}:${action.intent}`,
          )
        },
      ) as [ChoiceCandidate, ChoiceCandidate, ChoiceCandidate, ChoiceCandidate]

      nodes.push(
        decision(
          nodeId,
          blueprint.sceneId,
          blueprint.characterId,
          `${branch.prompt} Сейчас важнее ${frame}.`,
          choiceCandidates,
          stage === SAMPLE_STORY_CHOICE_POINTS ? 'after' : 'none',
        ),
      )

      if (stage === SAMPLE_STORY_CHOICE_POINTS) continue
      continuationActions.forEach((action, choiceIndex) => {
        nodes.push({
          nodeId: continuationReactionId(stage, branchIndex, choiceIndex),
          type: 'reaction',
          sceneId: blueprint.sceneId,
          messages: [
            message(
              `${blueprint.storyId}.reaction.continuation.${String(stage).padStart(2, '0')}.${branchIndex + 1}.${choiceIndex + 1}.message`,
              blueprint.characterId,
              action.reaction,
              160,
            ),
          ],
          nextNodeId: continuationDecisionId(stage + 1, choiceIndex),
          effects: [],
          editorial: fixtureEditorial(blueprint.characterId),
        })
      })
    }
  }

  blueprint.branches.forEach((branch, branchIndex) => {
    const branchNumber = branchIndex + 1
    branch.followUps.forEach((followUp, followUpIndex) => {
      const followUpNumber = followUpIndex + 1
      const endingNodeId = `${blueprint.storyId}.ending.${branchNumber}.${followUpNumber}`
      nodes.push({
        nodeId: endingNodeId,
        type: 'ending',
        sceneId: blueprint.sceneId,
        endingId: `${blueprint.storyId}.outcome.${branchNumber}.${followUpNumber}`,
        title: followUp.endingTitle,
        messages: [],
        epilogueFacts: [followUp.epilogue],
        editorial: fixtureEditorial(blueprint.characterId),
      })
    })
  })

  return nodes
}

const ira: StoryBlueprint = {
  storyId: 'story.ira.after-deadline',
  characterId: 'char.ira',
  sceneId: 'scene.ira.editorial-night',
  openingMessage:
    'Ты всё-таки здесь. В редакции остался один чайник и письмо об увольнении, которое я пока не отправила.',
  openingAttachment: {
    assetId: 'attachment.archive-note',
    altText: 'На столе лежат старая записка, ключ на синей ленте и билет.',
  },
  branches: [
    {
      openingChoice: 'Я здесь. Рассказывай с самого начала.',
      openingIntent: 'listen',
      openingReaction:
        'Тогда без красивой версии. Я нашла цифры, которые не сходятся.',
      prompt:
        'Главред просит поставить выпуск в печать утром. Если я подниму шум сейчас, номер остановят.',
      followUps: [
        {
          text: 'Покажи цифры. Сначала проверим, потом решим.',
          intent: 'verify',
          reaction:
            'Ира разворачивает ноутбук. В таблице четыре платежа одному подрядчику за один день.',
          endingTitle: 'Проверка до рассвета',
          epilogue:
            'Вы вместе сверили документы и нашли ошибку до отправки письма.',
        },
        {
          text: 'Останови выпуск. Репутацию потом не отредактируешь.',
          intent: 'stop-publication',
          reaction:
            'Ира кивает и впервые за вечер не смотрит на дверь кабинета главреда.',
          endingTitle: 'Номер на паузе',
          epilogue:
            'Ира выбрала открытый конфликт и сохранила копии материалов.',
        },
        {
          text: 'Сохрани копию и уходи. Это не твоя единственная ночь.',
          intent: 'set-boundary',
          reaction:
            'Она закрывает таблицу, но пересылает архив на защищённый диск.',
          endingTitle: 'Дверь закрыта вовремя',
          epilogue:
            'Ира ушла из редакции, сохранив доказательства и собственную границу.',
        },
        {
          text: 'Кому ещё ты доверяешь в редакции?',
          intent: 'find-ally',
          reaction:
            'После паузы Ира называет корректора, который уже задавал те же вопросы.',
          endingTitle: 'Третий человек',
          epilogue:
            'У разговора появился союзник, а у истории — второй свидетель.',
        },
      ],
    },
    {
      openingChoice: 'Сначала ответь: ты правда увольняешься?',
      openingIntent: 'ask-directly',
      openingReaction:
        'Правда. Но заявление — не главная причина, почему я позвала тебя ночью.',
      prompt:
        'Я подписала материал своим именем. Теперь не уверена, что все источники в нём настоящие.',
      followUps: [
        {
          text: 'Кто передал тебе источники?',
          intent: 'trace-source',
          reaction:
            'Ира называет продюсера отдела и тут же добавляет: «Он исчез из общего чата час назад».',
          endingTitle: 'След переписки',
          epilogue:
            'Вы сохранили журнал сообщений и восстановили цепочку передачи файлов.',
        },
        {
          text: 'Подпись твоя — решение тоже должно быть твоим.',
          intent: 'return-agency',
          reaction:
            'Она долго молчит, потом открывает черновик письма юридическому отделу.',
          endingTitle: 'Своё имя',
          epilogue:
            'Ира сама сообщила о сомнениях и не переложила решение на тебя.',
        },
        {
          text: 'Не отправляй заявление, пока не получишь копию договора.',
          intent: 'protect-rights',
          reaction:
            '«Вот за этим я тебя и позвала», — говорит Ира и впервые достаёт папку из сумки.',
          endingTitle: 'До подписи',
          epilogue:
            'Вы отделили трудовой конфликт от редакционного расследования.',
        },
        {
          text: 'Если источники выдуманы, кому это выгодно?',
          intent: 'follow-motive',
          reaction:
            'Ира пишет на полях три фамилии. Одну сразу зачёркивает, две оставляет.',
          endingTitle: 'Две фамилии',
          epilogue: 'Вместо паники появился список проверяемых мотивов.',
        },
      ],
    },
    {
      openingChoice: 'Можно ничего не объяснять. Просто посидим пять минут.',
      openingIntent: 'offer-silence',
      openingReaction:
        'Пять минут звучат выполнимо. Ира ставит чайник, не включая верхний свет.',
      prompt:
        'На четвёртой минуте она говорит: «Я боюсь не увольнения. Я боюсь, что промолчала слишком долго».',
      followUps: [
        {
          text: 'Молчание закончилось сейчас. Что можно сделать первым?',
          intent: 'start-small',
          reaction: '«Скопировать оригиналы», — отвечает она без паузы.',
          endingTitle: 'Первое действие',
          epilogue:
            'Вы начали с одного проверяемого шага вместо большого обещания.',
        },
        {
          text: 'Кому ты хотела рассказать раньше?',
          intent: 'name-trust',
          reaction:
            'Ира называет бывшую коллегу, с которой не говорила полгода.',
          endingTitle: 'Старый номер',
          epilogue:
            'Ира восстановила контакт с человеком, который знал прежние правила редакции.',
        },
        {
          text: 'Если сейчас слишком много — перенесём решение на утро.',
          intent: 'slow-down',
          reaction:
            'Она ставит будильник на семь и закрывает письмо без отправки.',
          endingTitle: 'Утро вместо паники',
          epilogue:
            'Решение осталось открытым, но перестало быть ночной ловушкой.',
        },
        {
          text: 'Я рядом, но выбрать за тебя не смогу.',
          intent: 'support-with-boundary',
          reaction:
            '«И не надо», — спокойно отвечает Ира и разворачивает к себе клавиатуру.',
          endingTitle: 'Решение Иры',
          epilogue: 'Поддержка не превратилась в управление чужим выбором.',
        },
      ],
    },
    {
      openingChoice: 'У меня чай и сорок минут. Выбирай порядок.',
      openingIntent: 'practical-support',
      openingReaction:
        '«Сначала чай. Потом письмо. Потом то, из-за чего письмо появилось».',
      prompt:
        'Ира показывает распечатку: в ней поменяли две строки уже после её финальной проверки.',
      followUps: [
        {
          text: 'Сверим версии файла по времени.',
          intent: 'audit-version',
          reaction:
            'В истории документа видно правку в 23:17 с чужой учётной записи.',
          endingTitle: 'Метка 23:17',
          epilogue:
            'У вас появилось точное время изменения и проверяемая учётная запись.',
        },
        {
          text: 'Сфотографируй распечатку и убери оригинал обратно.',
          intent: 'preserve-evidence',
          reaction:
            'Ира снимает каждую страницу и возвращает скрепку на прежнее место.',
          endingTitle: 'Копия без шума',
          epilogue:
            'Доказательство сохранено без преждевременного раскрытия расследования.',
        },
        {
          text: 'Позвони тому, кто вносил последнюю правку.',
          intent: 'confront-now',
          reaction:
            'Абонент отвечает сразу и слишком быстро говорит, что ничего не менял.',
          endingTitle: 'Слишком быстрый ответ',
          epilogue: 'Прямой звонок дал реакцию, которую можно проверить утром.',
        },
        {
          text: 'Сначала поешь. На пустой желудок расследование хуже.',
          intent: 'ground',
          reaction:
            'Ира достаёт из шкафа сухое печенье и смеётся ровно один раз.',
          endingTitle: 'Пауза у чайника',
          epilogue: 'Вы вернулись к документам после короткой бытовой паузы.',
        },
      ],
    },
  ],
}

const asya: StoryBlueprint = {
  storyId: 'story.asya.seven-minutes',
  characterId: 'char.asya',
  sceneId: 'scene.asya.security-log',
  openingMessage:
    'Камера у лифта отключилась ровно на семь минут. В это окно из офиса вышел человек без записи в журнале.',
  branches: [
    {
      openingChoice: 'Покажи журнал проходов, а не пересказ.',
      openingIntent: 'request-evidence',
      openingReaction:
        '«Наконец нормальный вопрос». Ася присылает выгрузку с четырьмя пропусками.',
      prompt:
        'Три пропуска отмечены дважды. Четвёртый появился только на выходе.',
      followUps: [
        {
          text: 'Проверь, кто мог выпустить дубликат.',
          intent: 'check-issuer',
          reaction:
            'Дубликат оформлен через терминал охраны, но в смене никто не признаётся.',
          endingTitle: 'Терминал охраны',
          epilogue:
            'Проверка сместилась от владельца пропуска к точке его выпуска.',
        },
        {
          text: 'Сравни время выхода с парковкой.',
          intent: 'cross-reference',
          reaction:
            'На парковке в ту минуту открылся шлагбаум без распознанного номера.',
          endingTitle: 'Пустой номер',
          epilogue:
            'Две независимые системы подтвердили один временной промежуток.',
        },
        {
          text: 'Может, пропуск вынесли в сумке другого человека?',
          intent: 'alternate-hypothesis',
          reaction:
            'Ася добавляет гипотезу и отмечает сотрудника с большой курьерской сумкой.',
          endingTitle: 'Чужая сумка',
          epilogue:
            'Вы не приняли первый цифровой след за доказанную личность.',
        },
        {
          text: 'Зафиксируй выгрузку до следующей синхронизации.',
          intent: 'freeze-data',
          reaction:
            'Ася сохраняет хэш и отключает автоматическую перезапись копии.',
          endingTitle: 'Замороженный журнал',
          epilogue: 'Исходные данные переживут утреннее обновление системы.',
        },
      ],
    },
    {
      openingChoice: 'Семь минут были и вчера. В то же время?',
      openingIntent: 'compare-pattern',
      openingReaction:
        'Ася открывает второй график. Вчера окно началось на две минуты раньше.',
      prompt:
        'Оба сбоя совпадают с резервным копированием, но оно длится двадцать минут.',
      followUps: [
        {
          text: 'Значит, копирование — прикрытие, а не причина.',
          intent: 'separate-cause',
          reaction:
            '«Пока только рабочая версия», — отвечает Ася и ставит рядом знак вопроса.',
          endingTitle: 'Версия с вопросом',
          epilogue:
            'Гипотеза осталась проверяемой и не стала преждевременным выводом.',
        },
        {
          text: 'Кто знает точное расписание копирования?',
          intent: 'map-access',
          reaction:
            'Список короткий: системный администратор, начальник безопасности и Ася.',
          endingTitle: 'Трое со временем',
          epilogue: 'Круг доступа сузился, но включил саму Асю.',
        },
        {
          text: 'Проверь сбой в дни, когда никто не выходил.',
          intent: 'seek-control-sample',
          reaction:
            'В воскресенье копирование прошло без единого потерянного кадра.',
          endingTitle: 'Чистое воскресенье',
          epilogue:
            'Контрольный день отделил штатный процесс от вмешательства.',
        },
        {
          text: 'Не строй график из двух точек. Нужна третья ночь.',
          intent: 'avoid-overfit',
          reaction:
            'Ася усмехается: «Ненавижу, когда статистика на твоей стороне».',
          endingTitle: 'Третья точка',
          epilogue:
            'Вы отложили вывод до наблюдения следующего резервного окна.',
        },
      ],
    },
    {
      openingChoice: 'Проверь, не сбито ли время на самой камере.',
      openingIntent: 'challenge-clock',
      openingReaction:
        'Смещение есть: камера спешит на сорок три секунды. Но семиминутный провал остаётся.',
      prompt:
        'После поправки человек выходит за пять секунд до открытия служебной двери на другом этаже.',
      followUps: [
        {
          text: 'Один человек не успел бы туда за пять секунд.',
          intent: 'test-physical-limit',
          reaction:
            'Ася прокладывает путь: минимум сорок восемь секунд даже бегом.',
          endingTitle: 'Сорок восемь секунд',
          epilogue:
            'Временная невозможность указала как минимум на двух участников.',
        },
        {
          text: 'А если запись служебной двери тоже спешит?',
          intent: 'verify-second-clock',
          reaction:
            'Её контроллер, наоборот, отстаёт на минуту. События меняются местами.',
          endingTitle: 'Два неверных часа',
          epilogue:
            'Синхронизация часов полностью изменила порядок наблюдаемых событий.',
        },
        {
          text: 'Найди устройство с эталонным временем.',
          intent: 'find-time-anchor',
          reaction:
            'Турникет синхронизирован с сервером и даёт опорную отметку.',
          endingTitle: 'Опорный турникет',
          epilogue: 'Расследование получило один проверенный временной якорь.',
        },
        {
          text: 'Сначала запиши все смещения, потом перестраивай линию.',
          intent: 'document-before-analysis',
          reaction:
            'Ася создаёт таблицу и запрещает себе двигать события вручную.',
          endingTitle: 'Таблица смещений',
          epilogue: 'Каждая поправка стала воспроизводимой, а не интуитивной.',
        },
      ],
    },
    {
      openingChoice: 'Кто первым заметил, что камера отключалась?',
      openingIntent: 'trace-discovery',
      openingReaction:
        'Начальник охраны. Причём до того, как ночная смена сдала отчёт.',
      prompt:
        'Он объяснил, что увидел уведомление. В системе таких уведомлений нет.',
      followUps: [
        {
          text: 'Попроси показать это уведомление.',
          intent: 'request-artifact',
          reaction:
            'Скриншот есть, но шрифт и время не совпадают с интерфейсом системы.',
          endingTitle: 'Чужой скриншот',
          epilogue:
            'Предъявленное уведомление оказалось отдельным изготовленным артефактом.',
        },
        {
          text: 'Не говори ему, что уведомлений не бывает.',
          intent: 'preserve-information-gap',
          reaction:
            'Ася удаляет набранное сообщение и оставляет вопрос открытым.',
          endingTitle: 'Неисправленная ошибка',
          epilogue:
            'Вы сохранили знание, которого подозреваемый не ожидал от вас.',
        },
        {
          text: 'Возможно, он получил письмо от внешнего сервиса.',
          intent: 'consider-external-source',
          reaction:
            'В почте находится автоматическое правило пересылки на личный адрес.',
          endingTitle: 'Правило пересылки',
          epilogue:
            'Версия о внешнем уведомлении привела к отдельному каналу утечки.',
        },
        {
          text: 'Кто ещё слышал его объяснение?',
          intent: 'find-witness',
          reaction:
            'Охранник ночной смены записал фразу в бумажный журнал дословно.',
          endingTitle: 'Запись от руки',
          epilogue:
            'У объяснения появился независимый свидетель и время фиксации.',
        },
      ],
    },
  ],
}

const dina: StoryBlueprint = {
  storyId: 'story.dina.three-knocks',
  characterId: 'char.dina',
  sceneId: 'scene.dina.empty-apartment',
  openingMessage:
    'В записи снова слышно три удара. Соседняя квартира пустует с апреля, а микрофон стоял у общей стены.',
  branches: [
    {
      openingChoice: 'Пришли оригинал, не пересланный файл.',
      openingIntent: 'request-original',
      openingReaction:
        'Дина загружает WAV. В нём нет обработки, зато есть тихий гул перед каждым ударом.',
      prompt:
        'Гул начинается за секунду до удара и каждый раз попадает в одну частоту.',
      followUps: [
        {
          text: 'Сравни частоту с лифтом и вентиляцией.',
          intent: 'compare-machinery',
          reaction: 'Вентиляция близко, но её тон выше. Лифт совпадает ровно.',
          endingTitle: 'Шахта лифта',
          epilogue:
            'Звук получил бытовую часть объяснения, но не источник трёх ударов.',
        },
        {
          text: 'Проверь, есть ли гул на других записях дома.',
          intent: 'search-baseline',
          reaction:
            'В дневных файлах он появляется только при остановке лифта на шестом этаже.',
          endingTitle: 'Шестой этаж',
          epilogue: 'Повторяемый механический след сузил место поиска.',
        },
        {
          text: 'Не усиливай сигнал. Сначала сохрани исходник и хэш.',
          intent: 'preserve-audio',
          reaction:
            'Дина создаёт контрольную сумму и копию только для анализа.',
          endingTitle: 'Чистая дорожка',
          epilogue:
            'Оригинал остался неизменным, а все фильтры применялись к копии.',
        },
        {
          text: 'Три удара могут идти по трубе, а не через стену.',
          intent: 'test-transmission',
          reaction:
            'Она переставляет микрофон к стояку. Следующая серия звучит вдвое громче.',
          endingTitle: 'Стояк',
          epilogue:
            'Вы нашли путь распространения звука, не объявляя его источником.',
        },
      ],
    },
    {
      openingChoice: 'Три удара были и вчера. В то же время?',
      openingIntent: 'compare-time',
      openingReaction:
        'Почти. Вчера — 02:14, сегодня — 02:17. Ровно после ночного лифта.',
      prompt:
        'Дина проверяет журнал: лифт вызывали с первого этажа, но дверь там не открывалась.',
      followUps: [
        {
          text: 'Попроси управляющую компанию проверить датчик двери.',
          intent: 'request-maintenance',
          reaction:
            'Заявку принимают и находят плавающую ошибку магнитного контакта.',
          endingTitle: 'Магнитный контакт',
          epilogue:
            'Один странный факт оказался неисправностью с номером заявки.',
        },
        {
          text: 'Не ходи к лифту одна ночью.',
          intent: 'set-safety-plan',
          reaction: '«Согласна. Утром возьму техника и соседа с пятого».',
          endingTitle: 'Проверка втроём',
          epilogue:
            'Расследование продолжилось днём и не потребовало одиночного риска.',
        },
        {
          text: 'Может, кто-то вызывает лифт снаружи и уходит.',
          intent: 'consider-human-cause',
          reaction:
            'Камера входа показывает курьера, который каждый раз путает подъезды.',
          endingTitle: 'Не тот подъезд',
          epilogue:
            'Повторяющийся вызов получил обычного, проверяемого участника.',
        },
        {
          text: 'Сверь время с домофоном, там отдельные часы.',
          intent: 'cross-check-clock',
          reaction:
            'Домофон отстаёт на три минуты. После поправки события совпадают.',
          endingTitle: 'Три минуты',
          epilogue: 'Разница системных часов объяснила временной сдвиг.',
        },
      ],
    },
    {
      openingChoice: 'Пустая квартира не значит пустой подъезд.',
      openingIntent: 'widen-context',
      openingReaction:
        '«Вот именно». Дина перечисляет ремонт на восьмом и склад дворника в подвале.',
      prompt: 'Удары слышны только в спальне и исчезают, если открыть окно.',
      followUps: [
        {
          text: 'Запиши с открытым и закрытым окном одновременно.',
          intent: 'controlled-recording',
          reaction:
            'Два микрофона показывают: звук приходит с улицы и отражается от стены.',
          endingTitle: 'Два микрофона',
          epilogue:
            'Контрольная запись отделила источник от акустического отражения.',
        },
        {
          text: 'Что происходит во дворе в это время?',
          intent: 'inspect-courtyard',
          reaction:
            'Ночной уборщик закрывает металлический контейнер тремя короткими движениями.',
          endingTitle: 'Контейнер во дворе',
          epilogue: 'Три удара оказались ритмом обычной ночной работы.',
        },
        {
          text: 'Перенеси микрофон в коридор и не оставайся там ждать.',
          intent: 'remote-test',
          reaction:
            'Дина ставит рекордер по таймеру и уходит пить чай к соседке.',
          endingTitle: 'Запись без дежурства',
          epilogue:
            'Эксперимент прошёл без необходимости ждать звук в одиночестве.',
        },
        {
          text: 'Спроси соседей, но не говори про пустую квартиру.',
          intent: 'avoid-leading-question',
          reaction:
            'Двое описывают металлический хлопок, никто не говорит про стену.',
          endingTitle: 'Без подсказки',
          epilogue:
            'Нейтральный вопрос не навязал соседям готовую мистическую версию.',
        },
      ],
    },
    {
      openingChoice: 'Сегодня ты там одна не остаёшься.',
      openingIntent: 'prioritize-safety',
      openingReaction:
        '«Без споров». Дина убирает рекордер в сумку и проверяет замок.',
      prompt:
        'Можно уйти сейчас или дождаться соседку в освещённом холле. Дина выбирает без давления.',
      followUps: [
        {
          text: 'Уходи сейчас. Запись можно продолжить завтра днём.',
          intent: 'leave-now',
          reaction:
            'Она вызывает такси, фотографирует дверь и спускается по лестнице.',
          endingTitle: 'Ночь вне дома',
          epilogue:
            'Граница безопасности не ухудшила отношения и не закрыла расследование.',
        },
        {
          text: 'Подожди соседку в холле, я останусь на связи.',
          intent: 'wait-with-support',
          reaction:
            'Дина садится у консьержа. Через восемь минут приходит соседка с собакой.',
          endingTitle: 'Освещённый холл',
          epilogue: 'Ожидание прошло в общей зоне и с понятным планом.',
        },
        {
          text: 'Позвони в управляющую компанию и зафиксируй обращение.',
          intent: 'create-record',
          reaction:
            'Оператор присваивает заявке номер и обещает утренний осмотр.',
          endingTitle: 'Номер заявки',
          epilogue:
            'Тревожная ситуация получила внешний журнал и ответственного исполнителя.',
        },
        {
          text: 'Пропустим эту сцену. Расскажи завтра, что выяснилось.',
          intent: 'use-safe-route',
          reaction: '«Хорошо. Никаких доказательств ценой бессонной ночи».',
          endingTitle: 'Без штрафа за границу',
          epilogue:
            'Сцена завершилась безопасно; история сохранила нейтральное продолжение.',
        },
      ],
    },
  ],
}

const assets: ContentAsset[] = [
  {
    assetId: 'portrait.ira',
    kind: 'portrait',
    path: 'portraits/ira.png',
    checksum:
      'sha256:b514f8bd9003cc79488bf563bf0d81e7b8fbb06f211a3577be42ec3ddcd16f06',
    width: 1024,
    height: 1024,
    altText: 'Графический портрет Иры с короткими тёмными волосами.',
    provenance: 'generated-fixture',
  },
  {
    assetId: 'portrait.asya',
    kind: 'portrait',
    path: 'portraits/asya.png',
    checksum:
      'sha256:bdbdf62a649105a5ce8fc68f649ac70d8ad7532f9e40b6df629d5d1cf000f41c',
    width: 1024,
    height: 1024,
    altText: 'Графический портрет Аси с тёмным каре.',
    provenance: 'generated-fixture',
  },
  {
    assetId: 'portrait.dina',
    kind: 'portrait',
    path: 'portraits/dina.png',
    checksum:
      'sha256:a4d01d7e0cc65ee50c381ea083d67ac1b0ba9a430f6f0d893f1cf0d45a35392f',
    width: 1024,
    height: 1024,
    altText: 'Графический портрет Дины с наушниками на шее.',
    provenance: 'generated-fixture',
  },
  {
    assetId: 'attachment.archive-note',
    kind: 'attachment',
    path: 'attachments/archive-note.png',
    checksum:
      'sha256:159e3626b8d140fb4f79b74bc060a137d863ff07473dc50387a77ada8481bddc',
    width: 1254,
    height: 1254,
    altText: 'Старая записка, ключ на синей ленте и билет на деревянном столе.',
    provenance: 'generated-fixture',
  },
  ...storyPreviewAssetsFor([ira.storyId, asya.storyId, dina.storyId]),
]

export const sampleContentPackage: ContentPackage = {
  manifest: {
    packId: 'pack.ru.sample.core',
    locale: 'ru-RU',
    schemaVersion: 1,
    contentVersion: '1.1.1',
    buildId: 'ru-sample-2026.08.23.2',
    minEngineVersion: '1.0.0',
    maxEngineVersion: '1.x',
    createdAt: '2026-08-23T00:00:00.000Z',
    checksum: 'sha256:development-fixture',
    signature: 'ed25519:development-fixture',
  },
  characters: [
    {
      characterId: 'char.ira',
      name: 'Ира',
      ageLabel: '27 лет',
      isAdult: true,
      hook: 'Ушла из редакции и не говорит почему.',
      description:
        'Камерная история о ночной редакции, чужих правках и решении, которое нельзя принять за другого человека.',
      genres: ['драма', 'современность'],
      dynamics: ['доверие', 'границы'],
      portraitAssetId: 'portrait.ira',
      accent: 'ember',
    },
    {
      characterId: 'char.asya',
      name: 'Ася',
      ageLabel: '31 год',
      isAdult: true,
      hook: 'Нашла семь минут, которых нет в журнале камер.',
      description:
        'Детектив о несовпадающих часах, цифровых следах и гипотезах, которые нужно уметь опровергать.',
      genres: ['детектив', 'технологии'],
      dynamics: ['сотрудничество', 'сомнение'],
      portraitAssetId: 'portrait.asya',
      accent: 'ochre',
    },
    {
      characterId: 'char.dina',
      name: 'Дина',
      ageLabel: '29 лет',
      isAdult: true,
      hook: 'Записала три удара из квартиры, где никто не живёт.',
      description:
        'Приземлённая мистика о звуке в ночном доме. Любую тревожную сцену можно безопасно пропустить.',
      genres: ['мистика', 'расследование'],
      dynamics: ['забота', 'проверка фактов'],
      portraitAssetId: 'portrait.dina',
      accent: 'plum',
    },
  ],
  stories: [
    {
      storyId: ira.storyId,
      characterId: ira.characterId,
      title: 'После дедлайна',
      premise:
        'Поздняя редакция, письмо об увольнении и две строки, которые кто-то заменил.',
      previewAssetId: storyPreviewAssetIdFor(ira.storyId),
      status: 'complete',
      rating: '16+',
      durationMinutes: 75,
      warningIds: [],
      episodeIds: ['episode.ira.after-deadline.1'],
    },
    {
      storyId: asya.storyId,
      characterId: asya.characterId,
      title: 'Семь минут',
      premise:
        'Камера выключилась ненадолго. Этого хватило, чтобы нарушить всю временную линию.',
      previewAssetId: storyPreviewAssetIdFor(asya.storyId),
      status: 'complete',
      rating: '16+',
      durationMinutes: 75,
      warningIds: [],
      episodeIds: ['episode.asya.seven-minutes.1'],
    },
    {
      storyId: dina.storyId,
      characterId: dina.characterId,
      title: 'Три удара',
      premise:
        'Ночная запись из пустой квартиры проверяет не смелость, а качество вопросов.',
      previewAssetId: storyPreviewAssetIdFor(dina.storyId),
      status: 'complete',
      rating: '16+',
      durationMinutes: 75,
      warningIds: ['warning.dina.frightening'],
      episodeIds: ['episode.dina.three-knocks.1'],
    },
  ],
  episodes: [
    {
      episodeId: 'episode.ira.after-deadline.1',
      storyId: ira.storyId,
      title: 'Свет в редакции',
      ordinal: 1,
      entryNodeId: `${ira.storyId}.decision.open`,
      downloadBytes: 1_048_576,
      isBundled: true,
      checkpointIds: [],
    },
    {
      episodeId: 'episode.asya.seven-minutes.1',
      storyId: asya.storyId,
      title: 'Ночная выгрузка',
      ordinal: 1,
      entryNodeId: `${asya.storyId}.decision.open`,
      downloadBytes: 1_048_576,
      isBundled: true,
      checkpointIds: [],
    },
    {
      episodeId: 'episode.dina.three-knocks.1',
      storyId: dina.storyId,
      title: 'Общая стена',
      ordinal: 1,
      entryNodeId: `${dina.storyId}.decision.open`,
      downloadBytes: 1_048_576,
      isBundled: true,
      checkpointIds: [],
    },
  ],
  nodes: [
    ...buildStoryNodes(ira),
    ...buildStoryNodes(asya),
    ...buildStoryNodes(dina),
  ],
  warnings: [
    {
      warningId: 'warning.dina.frightening',
      category: 'frightening',
      severity: 'high',
      summary: 'Тревожная ночная сцена в пустом доме.',
      detail:
        'Есть напряжённое ожидание неизвестного звука. Нет графического насилия, погони или скримеров.',
      sceneId: dina.sceneId,
      safeRoute: {
        summary:
          'Дина ушла из квартиры и вернулась к проверке днём вместе с техником. Это не ухудшило отношения.',
        effects: [
          {
            effectId: 'effect.dina.safe-route',
            op: 'setMemory',
            key: 'memory.dina.usedSafeRoute',
            value: true,
          },
        ],
        nextNodeId: `${dina.storyId}.ending.4.4`,
      },
    },
  ],
  assets,
}

export const sampleNodesById = new Map(
  sampleContentPackage.nodes.map(node => [node.nodeId, node]),
)

export function findCharacterForStory(storyId: string) {
  const story = sampleContentPackage.stories.find(
    item => item.storyId === storyId,
  )
  if (!story) return undefined
  return sampleContentPackage.characters.find(
    character => character.characterId === story.characterId,
  )
}

export function findEpisodeForStory(storyId: string) {
  return sampleContentPackage.episodes.find(
    episode => episode.storyId === storyId,
  )
}

export {
  BULK_FIXTURE_DEFAULTS,
  BULK_FIXTURE_SCALE_DEFAULTS,
  generateBulkFixtureContentPackage,
} from './bulk-content'
