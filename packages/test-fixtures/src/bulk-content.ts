import type {
  Character,
  ChoiceCandidate,
  ContentAsset,
  ContentNode,
  ContentPackage,
  DecisionNode,
  NarrativeMessage,
} from '@razvilka/content-schema'

import {
  storyPreviewAssetsFor,
  storyPreviewDefinitionFor,
} from './story-previews.generated'

export const BULK_FIXTURE_DEFAULTS = {
  stageCount: 50,
  storyCount: 240,
} as const

/**
 * A development-only scale candidate that clears the structural GA inventory
 * thresholds without being mistaken for human-approved release content.
 * Keeping it out of the bundled reader avoids turning the first launch into a
 * 600k-node migration while still exercising the real compiler on the target
 * catalog shape.
 */
export const BULK_FIXTURE_SCALE_DEFAULTS = {
  stageCount: 50,
  storyCount: 1_200,
} as const

export interface BulkFixtureOptions {
  stageCount?: number
  storyCount?: number
}

const branchCount = 4
const accents: Character['accent'][] = [
  'ember',
  'ochre',
  'rose',
  'plum',
  'moss',
]
const names = [
  'Лада',
  'Мира',
  'Ника',
  'Олеся',
  'Рита',
  'Соня',
  'Тая',
  'Ульяна',
  'Фаина',
  'Эля',
  'Яна',
  'Вера',
  'Алина',
  'Алиса',
  'Алёна',
  'Анна',
  'Арина',
  'Валерия',
  'Варвара',
  'Вика',
  'Галина',
  'Дарья',
  'Ева',
  'Екатерина',
  'Елена',
  'Жанна',
  'Злата',
  'Инна',
  'Ирина',
  'Кира',
  'Ксения',
  'Лилия',
  'Любовь',
  'Людмила',
  'Марина',
  'Мария',
  'Милана',
  'Надежда',
  'Наталья',
  'Оксана',
  'Полина',
  'Регина',
  'Светлана',
  'Таисия',
  'Тамара',
  'Татьяна',
  'Юлия',
  'Юна',
  'Аделина',
  'Белла',
  'Влада',
  'Грета',
  'Диана',
  'Илона',
  'Карина',
  'Лина',
  'Майя',
  'Мелания',
  'Ольга',
  'София',
  'Элина',
  'Эмилия',
]
const surnames = [
  'Волкова',
  'Орлова',
  'Крылова',
  'Соколова',
  'Морозова',
  'Лебедева',
  'Белова',
  'Тихонова',
  'Романова',
  'Зорина',
  'Громова',
  'Кузнецова',
  'Иванова',
  'Макарова',
  'Ершова',
  'Никитина',
  'Сафонова',
  'Лукина',
  'Данилова',
  'Быкова',
  'Абрамова',
  'Алексеева',
  'Антонова',
  'Баранова',
  'Богданова',
  'Власова',
  'Виноградова',
  'Вишневская',
  'Гаврилова',
  'Голубева',
  'Гусева',
  'Демидова',
  'Дорофеева',
  'Жукова',
  'Захарова',
  'Киселёва',
  'Комарова',
  'Королёва',
  'Костина',
  'Котова',
  'Куликова',
  'Ларионова',
  'Логинова',
  'Мартынова',
  'Мельникова',
  'Миронова',
  'Назарова',
  'Нестерова',
  'Новикова',
  'Осипова',
  'Павлова',
  'Панина',
  'Пахомова',
  'Петрова',
  'Пономарёва',
  'Попова',
  'Прохорова',
  'Родионова',
  'Руднева',
  'Рыбакова',
  'Самойлова',
  'Селезнёва',
  'Семёнова',
  'Серова',
  'Смирнова',
  'Степанова',
  'Тарасова',
  'Фёдорова',
  'Харитонова',
  'Чернова',
  'Шарова',
  'Щербакова',
  'Юдина',
  'Яковлева',
]
const themes = [
  'ночная смена',
  'старый архив',
  'городской маршрут',
  'сбой в расписании',
  'письмо без адреса',
  'исчезнувшая запись',
  'след на плёнке',
  'чужой ключ',
  'тихий двор',
  'неожиданный звонок',
  'пустая станция',
  'карта с пометками',
  'неподписанный конверт',
  'сбой в архивном индексе',
  'чужая заметка на полях',
  'ночной автобус',
  'письмо из соседнего дома',
  'неполная запись разговора',
  'ключ от подсобки',
  'папка без номера',
  'выцветшая афиша',
  'окно напротив',
  'голосовое без подписи',
  'следы на снегу',
  'забытый пароль',
  'снимок с оборота',
  'записка под дверью',
  'перенесённая встреча',
  'квитанция без суммы',
  'старый фотоаппарат',
  'пустой шкафчик',
]
const genres = [
  ['драма', 'современность'],
  ['детектив', 'город'],
  ['мистика', 'расследование'],
  ['приключение', 'современность'],
] as const
const dynamics = [
  ['доверие', 'границы'],
  ['сотрудничество', 'сомнение'],
  ['забота', 'проверка фактов'],
  ['выбор', 'последствия'],
] as const
const choiceIntents = [
  ['проверить факты', 'ask-detail'],
  ['обозначить границу', 'set-boundary'],
  ['подставить плечо', 'offer-alliance'],
  ['не рубить с плеча', 'hold-question'],
] as const

const intentCallbacks: Record<string, (context: DecisionContext) => string> = {
  'ask-detail': context =>
    `После твоего вопроса я ещё раз проверила ${context.accusative}.`,
  'set-boundary': context =>
    `Мы договорились не уходить в сторону: сейчас проверяем только ${context.accusative}.`,
  'offer-alliance': context =>
    `Вдвоём будет быстрее. Давай проверим ${context.accusative}.`,
  'hold-question': context =>
    `С выводом повременим — сначала сверим ${context.accusative}.`,
}

/**
 * Catalog copy is still generated deterministically for scale testing, but it
 * should read like a shelf of stories rather than an exported fixture table.
 * These short title stems deliberately avoid numeric labels and give the
 * reader a recognisable emotional or situational hook before opening a story.
 */
const storyTitleStems = [
  'После последнего звонка',
  'Точка на карте',
  'Пока не погас свет',
  'Входящие без ответа',
  'Между двумя версиями',
  'Семь минут тишины',
  'Чужая пометка',
  'Не отправляй пока',
  'До первого поезда',
  'Там, где шумит лифт',
  'Снимок с оборота',
  'Слово на полях',
  'Ключ не к той двери',
  'Вторая попытка',
  'Когда всё сходится',
  'Пауза перед ответом',
] as const

const choiceTextSets = [
  [
    'Проверим {context}. Зацепка: {clue}.',
    'Сначала договоримся: обсуждаем только {context}. Зацепка: {clue}.',
    'Давай проверим {context} вдвоём. Зацепка: {clue}.',
    'Не будем рубить с плеча. Сначала проверим {context}: {clue}.',
  ],
  [
    'Покажи исходник. Сверим {context}: {clue}.',
    'Стоп. Пока обсуждаем только {context}: {clue}.',
    'Давай по шагам. Разберём {context}: {clue}.',
    'Пока рано ставить точку. Проверим {context}: {clue}.',
  ],
  [
    'Что известно наверняка? Проверим {context}: {clue}.',
    'Не будем уходить в сторону. Сейчас проверяем {context}: {clue}.',
    'Если хочешь, проверим {context} вдвоём: {clue}.',
    'Возьмём паузу с выводами. Проверим {context}: {clue}.',
  ],
  [
    'Сверим источник и {context}: {clue}.',
    'Сначала договоримся о рамках. Потом проверим {context}: {clue}.',
    'Я не тороплюсь. Давай разберём {context}: {clue}.',
    'С выводом повременим. Проверим {context}: {clue}.',
  ],
  [
    'Проверим {context}. Вот зацепка: {clue}.',
    'Пока только {context}. Зацепка: {clue}.',
    'Давай сверим {context} вдвоём: {clue}.',
    'Не будем додумывать. Посмотрим на {context}: {clue}.',
  ],
  [
    'Уточним одну вещь — {context}. Зацепка: {clue}.',
    'Договоримся сразу: дальше только про {context}. Зацепка: {clue}.',
    'Я помогу. Проверим {context}: {clue}.',
    'Сначала проверим {context}: {clue}. Выводы потом.',
  ],
] as const
/**
 * Context words keep generated fixtures readable instead of appending opaque
 * numeric branch markers to player-facing copy. They also give the scale
 * harness enough authored surface variation to expose duplicate-text bugs.
 */
type DecisionContext = Readonly<{
  accusative: string
  genitive: string
  instrumental: string
  about: string
}>

const decisionContexts: readonly (readonly [
  DecisionContext,
  DecisionContext,
  DecisionContext,
  DecisionContext,
])[] = [
  [
    {
      accusative: 'первую деталь',
      genitive: 'первой детали',
      instrumental: 'первой деталью',
      about: 'первой детали',
    },
    {
      accusative: 'сроки',
      genitive: 'сроков',
      instrumental: 'сроками',
      about: 'сроках',
    },
    {
      accusative: 'источник',
      genitive: 'источника',
      instrumental: 'источником',
      about: 'источнике',
    },
    {
      accusative: 'риск',
      genitive: 'риска',
      instrumental: 'риском',
      about: 'риске',
    },
  ],
  [
    {
      accusative: 'обещание',
      genitive: 'обещания',
      instrumental: 'обещанием',
      about: 'обещании',
    },
    {
      accusative: 'условия',
      genitive: 'условий',
      instrumental: 'условиями',
      about: 'условиях',
    },
    {
      accusative: 'список участников',
      genitive: 'списка участников',
      instrumental: 'списком участников',
      about: 'списке участников',
    },
    {
      accusative: 'порядок действий',
      genitive: 'порядка действий',
      instrumental: 'порядком действий',
      about: 'порядке действий',
    },
  ],
  [
    {
      accusative: 'старую запись',
      genitive: 'старой записи',
      instrumental: 'старой записью',
      about: 'старой записи',
    },
    {
      accusative: 'переписку',
      genitive: 'переписки',
      instrumental: 'перепиской',
      about: 'переписке',
    },
    {
      accusative: 'маршрут',
      genitive: 'маршрута',
      instrumental: 'маршрутом',
      about: 'маршруте',
    },
    {
      accusative: 'последовательность событий',
      genitive: 'последовательности событий',
      instrumental: 'последовательностью событий',
      about: 'последовательности событий',
    },
  ],
  [
    {
      accusative: 'письмо',
      genitive: 'письма',
      instrumental: 'письмом',
      about: 'письме',
    },
    {
      accusative: 'доказательство',
      genitive: 'доказательства',
      instrumental: 'доказательством',
      about: 'доказательстве',
    },
    {
      accusative: 'показания свидетеля',
      genitive: 'показаний свидетеля',
      instrumental: 'показаниями свидетеля',
      about: 'показаниях свидетеля',
    },
    {
      accusative: 'запасной вариант',
      genitive: 'запасного варианта',
      instrumental: 'запасным вариантом',
      about: 'запасном варианте',
    },
  ],
  [
    {
      accusative: 'последнюю версию',
      genitive: 'последней версии',
      instrumental: 'последней версией',
      about: 'последней версии',
    },
    {
      accusative: 'время встречи',
      genitive: 'времени встречи',
      instrumental: 'временем встречи',
      about: 'времени встречи',
    },
    {
      accusative: 'чужую просьбу',
      genitive: 'чужой просьбы',
      instrumental: 'чужой просьбой',
      about: 'чужой просьбе',
    },
    {
      accusative: 'план',
      genitive: 'плана',
      instrumental: 'планом',
      about: 'плане',
    },
  ],
  [
    {
      accusative: 'утреннюю запись',
      genitive: 'утренней записи',
      instrumental: 'утренней записью',
      about: 'утренней записи',
    },
    {
      accusative: 'разговор',
      genitive: 'разговора',
      instrumental: 'разговором',
      about: 'разговоре',
    },
    {
      accusative: 'предложенную помощь',
      genitive: 'предложенной помощи',
      instrumental: 'предложенной помощью',
      about: 'предложенной помощи',
    },
    {
      accusative: 'причину паузы',
      genitive: 'причины паузы',
      instrumental: 'причиной паузы',
      about: 'причине паузы',
    },
  ],
] as const
const decisionPrompts = [
  'Сначала проверим {context}. Остальное пока отложим.',
  'Я всё думаю про {context}. С чего начать проверку?',
  'Нельзя упустить {context}. Что проверим сначала?',
  'Если первая версия не подтвердится, что проверим следующим?',
] as const

/**
 * Fifty choice points need fifty distinct pieces of scene evidence. Keeping
 * the object and its position separate gives the generated fixture a
 * readable, non-numeric progression without repeating the same chat copy.
 */
const stageEvidenceObjects = [
  'листок с зачёркнутой датой',
  'конверт без обратного адреса',
  'фотография с обрезанным краем',
  'ключ на синей ленте',
  'чек с неровной печатью',
  'карта с пустым кварталом',
  'папка с тонкой резинкой',
  'диктофон с короткой записью',
  'блокнот с одной лишней строкой',
  'билет с вчерашней датой',
] as const
const stageEvidencePositions = [
  'на краю стола',
  'у окна',
  'возле чашки',
  'под лампой',
  'рядом с открытым блокнотом',
] as const

const stageEvidenceFor = (stage: number): string =>
  `${stageEvidenceObjects[stage % stageEvidenceObjects.length]!} ${stageEvidencePositions[Math.floor(stage / stageEvidenceObjects.length) % stageEvidencePositions.length]!}`

const anchorPlaces = [
  'в архиве на Полевой',
  'у киоска на Северной',
  'в мастерской у реки',
  'на пустой платформе',
  'в читальном зале',
  'у подъезда с жёлтой дверью',
  'в ночной диспетчерской',
  'на лестнице старого дома',
  'в фотолаборатории',
  'на кухне после смены',
  'у окна напротив',
  'в подсобке театра',
  'на рынке перед закрытием',
  'в автобусе до конечной',
  'у речного причала',
  'в кабинете без вывески',
  'на чердаке библиотеки',
  'в гараже за школой',
  'у лестницы в метро',
  'в маленьком кафе у моста',
  'на дачной веранде',
  'в коридоре поликлиники',
  'у старого кинотеатра',
  'в комнате с зелёной лампой',
  'на остановке после дождя',
  'в редакции под утро',
  'у закрытого павильона',
  'в дворовой мастерской',
  'на набережной у маяка',
  'в школьном архиве',
  'у железной ограды',
  'в вагоне без пассажиров',
  'в студии на Лесной',
  'у аптеки на углу',
  'в дворе за вокзалом',
  'на крыше мастерской',
  'в коридоре общежития',
  'у старого фонаря',
  'в кабинете с картой',
  'на балконе над двором',
  'в закрытой кассе',
  'у гаражей на окраине',
  'в комнате с одним стулом',
  'на перроне после полуночи',
  'в шкафу под лестницей',
  'у витрины без света',
  'в мастерской на втором этаже',
  'на площадке у реки',
  'в фотобудке у метро',
  'у двери с новой царапиной',
  'в комнате ожидания',
  'на дворовой скамейке',
  'в архиве под крышей',
  'у окна с видом на рельсы',
  'в коридоре после репетиции',
  'на лестнице к чердаку',
  'в пункте выдачи',
  'у гаража с красными воротами',
  'в кабинете на первом этаже',
  'на скамейке возле школы',
  'в комнате с выключенным радио',
  'у моста после дождя',
  'в пустом зале ожидания',
  'на балконе над мастерской',
] as const
const anchorDetails = [
  'с папкой без номера',
  'с ключом на синей ленте',
  'с записью на обороте',
  'с фотографией без даты',
  'с голосовым без подписи',
  'с письмом без адресата',
  'с чужим расписанием',
  'с выцветшей квитанцией',
  'с двумя версиями одного файла',
  'с заметкой на полях',
  'с пустым конвертом',
  'с картой, где нет улицы',
  'с номером, которого нет в журнале',
  'с последним кадром на плёнке',
  'с пропуском без фотографии',
  'с диктофоном на одном проценте',
  'с чек-листом без подписи',
  'с черновиком в корзине',
  'с билетом на вчерашнюю дату',
  'с адресом, зачёркнутым карандашом',
  'с двумя одинаковыми печатями',
  'с коробкой из чужого подъезда',
  'с ключом, который не подходит',
  'с письмом, пришедшим без конверта',
  'с фотографией, обрезанной по краю',
  'с незакрытой вкладкой',
  'с журналом, где пропущена строка',
  'с голосом на фоне работающего лифта',
  'с датой, сдвинутой на час',
  'с папкой, которую забыли убрать',
  'с пометкой «вернуться позже»',
  'с ключом от неизвестного замка',
  'с конвертом без марки',
  'с листом в клетку',
  'с незнакомым почерком',
  'с номером на стикере',
  'с чековой лентой',
  'с одной лишней строкой',
  'с песком в кармане',
  'с потёртым брелоком',
  'с датой на полях',
  'с коротким списком',
  'с ручкой без колпачка',
  'с записью на диктофоне',
  'с чужой подписью',
  'с вырванной страницей',
  'с пятном от кофе',
  'с билетом без маршрута',
  'с распечаткой из терминала',
  'с папкой на резинке',
  'с ключ-картой',
  'с выключенным телефоном',
  'с пометкой красным карандашом',
  'с фрагментом карты',
  'с пустым полем в форме',
  'с коротким звонком',
  'с надорванным краем',
  'с коробкой без этикетки',
  'с расписанием на завтра',
  'с двумя разными датами',
  'с фотографией в рамке',
  'с закрытым замком',
  'с листом из блокнота',
  'с последним сообщением',
] as const

const choiceAnchorDetails = [
  'папка без номера',
  'синий ключ',
  'запись на обороте',
  'фотография без даты',
  'голосовое сообщение',
  'письмо без адресата',
  'чужое расписание',
  'выцветшая квитанция',
  'две версии файла',
  'заметка на полях',
  'пустой конверт',
  'карта без улицы',
  'несуществующий номер',
  'последний кадр',
  'пропуск без фото',
  'диктофон',
  'чек-лист',
  'черновик',
  'билет на вчера',
  'зачёркнутый адрес',
  'две печати',
  'чужая коробка',
  'неподходящий ключ',
  'письмо без конверта',
  'обрезанная фотография',
  'незакрытая вкладка',
  'журнал с пропуском',
  'голос у лифта',
  'сдвинутая дата',
  'забытая папка',
  'пометка «позже»',
  'неизвестный замок',
  'конверт без марки',
  'лист в клетку',
  'незнакомый почерк',
  'номер на стикере',
  'чековая лента',
  'одна лишняя строка',
  'песок в кармане',
  'потёртый брелок',
  'дата на полях',
  'короткий список',
  'ручка без колпачка',
  'запись на диктофоне',
  'чужая подпись',
  'вырванная страница',
  'пятно от кофе',
  'билет без маршрута',
  'распечатка терминала',
  'папка на резинке',
  'ключ-карта',
  'выключенный телефон',
  'пометка красным карандашом',
  'фрагмент карты',
  'пустое поле',
  'короткий звонок',
  'надорванный край',
  'коробка без этикетки',
  'расписание на завтра',
  'две разные даты',
  'фотография в рамке',
  'закрытый замок',
  'лист из блокнота',
  'последнее сообщение',
] as const

const anchorForStory = (storyIndex: number): string => {
  const place = anchorPlaces[storyIndex % anchorPlaces.length]!
  const detail =
    anchorDetails[
      Math.floor(storyIndex / anchorPlaces.length) % anchorDetails.length
    ]!
  return `${place}, рядом с ${detail.replace(/^с /, '')}`
}

const choiceClueForStory = (storyIndex: number): string => {
  const detail =
    choiceAnchorDetails[
      Math.floor(storyIndex / anchorPlaces.length) % choiceAnchorDetails.length
    ]!
  return detail
}

const pad = (value: number, width = 4): string =>
  String(value).padStart(width, '0')

const russianCount = (
  count: number,
  forms: readonly [one: string, few: string, many: string],
): string => {
  const absolute = Math.abs(count)
  const lastTwo = absolute % 100
  const last = absolute % 10
  const noun =
    last === 1 && lastTwo !== 11
      ? forms[0]
      : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)
        ? forms[1]
        : forms[2]

  return `${count} ${noun}`
}

const withRussianS = (phrase: string): string =>
  /^(?:[сз][бвгджзклмнпрстфхцчшщ]|врем)/i.test(phrase)
    ? `со ${phrase}`
    : `с ${phrase}`

const four = <T>(items: readonly T[]): [T, T, T, T] => [
  items[0]!,
  items[1]!,
  items[2]!,
  items[3]!,
]

const message = (
  messageId: string,
  speakerId: string,
  text: string,
  delayMs = 120,
): NarrativeMessage => ({
  messageId,
  speakerId,
  text,
  delayMs,
  kind: 'message',
})

const editorial = (characterId: string): DecisionNode['editorial'] => ({
  writerId: 'fixture.bulk.generator.2026-08-14',
  voiceEditorId: 'fixture.not-human-approved',
  continuityEditorId: 'fixture.not-human-approved',
  status: 'fixture',
  voiceCardVersion: `${characterId}.bulk.fixture.1`,
  warningProfileId: null,
})

const makeCharacter = (index: number): Character => {
  const name = `${names[index % names.length]} ${surnames[Math.floor(index / names.length) % surnames.length]}`
  const firstName = names[index % names.length]!
  const anchor = anchorForStory(index)
  const genre = genres[index % genres.length]!
  const dynamic = dynamics[index % dynamics.length]!
  const hooks = [
    `${firstName} не любит делать выводы на ходу. В этой истории слишком много белых пятен.`,
    `Смена закончилась. Странная деталь нашлась ${anchor}.`,
    `${firstName} привыкла проверять мелочи. Сегодня одна из них заставила её вернуться к записям.`,
    `${firstName} больше всего боится поспешить и обвинить не того человека.`,
    `Когда ${firstName} пишет «есть минутка?», значит, снова нашлось то, о чём лучше поговорить.`,
    `Она нашла не ответ, а новую зацепку ${anchor}.`,
  ] as const
  const hookTails = [
    ' Похоже, без разговора не обойтись.',
    ' Сегодня лучше не спешить.',
    ' Сначала стоит выслушать обе стороны.',
    ' Дальше нужен один точный вопрос.',
    ' Эту деталь придётся проверить ещё раз.',
    ' Тут без проверки легко ошибиться.',
    ' Иногда лучше сначала взять паузу.',
  ] as const
  const descriptions = [
    `Разговор начинается ${anchor}: в записях не сходятся время, подписи и порядок событий.`,
    `Сначала это обычный разговор. Потом ${firstName} находит странную деталь ${anchor}, и прежняя версия перестаёт сходиться.`,
    `Двое сверяют версии, найденные ${anchor}, и каждый отвечает за своё решение.`,
    `Поздний разговор начинается ${anchor}: одна деталь не сходится с остальными, и её нужно проверить.`,
  ] as const
  return {
    characterId: `char.bulk.${pad(index + 1)}`,
    name,
    ageLabel: russianCount(25 + (index % 12), ['год', 'года', 'лет']),
    isAdult: true,
    hook: `${hooks[index % hooks.length]!}${hookTails[index % hookTails.length]}`,
    description: descriptions[index % descriptions.length]!,
    genres: [...genre],
    dynamics: [...dynamic],
    portraitAssetId: `portrait.${['ira', 'asya', 'dina', 'vera'][index % 4]}`,
    accent: accents[index % accents.length]!,
  }
}

const makeStory = (
  index: number,
  character: Character,
  stageCount: number,
): ContentPackage['stories'][number] => {
  const theme = themes[index % themes.length]!
  const anchor = anchorForStory(index)
  const storyId = `story.bulk.${pad(index + 1)}`
  const preview = storyPreviewDefinitionFor(storyId)
  const stem = storyTitleStems[index % storyTitleStems.length]!
  const title = `${theme[0]?.toUpperCase() ?? theme}${theme.slice(1)} — ${stem}`
  const premises = [
    `Всё начинается ${anchor}: в записях обнаруживается деталь, которой там не должно быть.`,
    `${stem} начинается с находки ${anchor}. Она заставляет перепроверить даты, подписи и чужие алиби.`,
    `Деталь, найденная ${anchor}, ломает привычную версию событий. Дальше придётся сверять факты и решать, кому верить.`,
  ] as const
  return {
    storyId,
    characterId: character.characterId,
    title,
    premise: premises[index % premises.length]!,
    ...(preview ? { previewAssetId: preview.asset.assetId } : {}),
    status: 'complete',
    rating: '16+',
    durationMinutes: Math.round(stageCount * 1.5),
    warningIds: [],
    episodeIds: [`episode.bulk.${pad(index + 1)}.1`],
  }
}

const makeAssets = (storyIds: readonly string[]): ContentAsset[] => [
  {
    assetId: 'portrait.ira',
    kind: 'portrait',
    path: 'portraits/ira.png',
    checksum:
      'sha256:e1e69a72f0c1d7351d9eb6e6adf571031b7f682861140144f822e91d47745fbc',
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
      'sha256:15c797c9c3aa48f59863abb0318f3b1b20701938b4c28aed6d13d92485d276b0',
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
      'sha256:23149991a0f62f5e520cb1a328f3c79bcbdac79eb8897ac855175e79fa5b8ded',
    width: 1024,
    height: 1024,
    altText: 'Графический портрет Дины с наушниками на шее.',
    provenance: 'generated-fixture',
  },
  {
    assetId: 'portrait.vera',
    kind: 'portrait',
    path: 'portraits/vera.png',
    checksum:
      'sha256:3b16997f02265b4ed10e3a869fa23a4998d9ea00053ef0ab5dcdebf209603138',
    width: 1024,
    height: 1024,
    altText: 'Графический портрет Веры с короткими рыжими кудрями.',
    provenance: 'generated-fixture',
  },
  ...storyPreviewAssetsFor(storyIds),
]

const decisionIdForStage = (storyId: string, stage: number): string =>
  stage === 0
    ? `${storyId}.decision.00.root`
    : `${storyId}.decision.${pad(stage, 2)}`

const endingNodeId = (storyId: string, choiceBranch: number): string =>
  `${storyId}.ending.${choiceBranch + 1}`

const makeChoice = (
  storyId: string,
  storyIndex: number,
  stage: number,
  choiceBranch: number,
  reactionId: string,
): ChoiceCandidate => {
  const [, intent] = choiceIntents[choiceBranch]!
  const choiceId = `${storyId}.choice.${pad(stage, 2)}.${choiceBranch + 1}`
  const clue = choiceClueForStory(storyIndex)
  const contextRow =
    decisionContexts[stage % decisionContexts.length] ?? decisionContexts[0]!
  const context = contextRow[choiceBranch] ?? contextRow[0]
  const choiceSet =
    choiceTextSets[(storyIndex + stage) % choiceTextSets.length]!
  const choiceText = choiceSet[choiceBranch]!.replace(
    '{context}',
    context.accusative,
  ).replace('{clue}', clue)
  return {
    choiceId,
    text: choiceText,
    intent,
    priority: 0,
    intentionalRepeatId: `${storyId}.choice-template.${choiceBranch + 1}`,
    when: { op: 'all', args: [] },
    effects: [
      {
        effectId: `${choiceId}.last-intent`,
        op: 'setMemory',
        key: `${storyId}.memory.lastIntent`,
        value: intent,
      },
    ],
    nextNodeId: reactionId,
  }
}

const makeDecision = (
  storyId: string,
  character: Character,
  storyIndex: number,
  stage: number,
  stageCount: number,
): DecisionNode => {
  const nodeId = decisionIdForStage(storyId, stage)
  const anchor = anchorForStory(storyIndex)
  const stageEvidence = stageEvidenceFor(stage)
  const context = decisionContexts[stage % decisionContexts.length]![0]
  const prompt = decisionPrompts[
    (storyIndex + stage) % decisionPrompts.length
  ]!.replace('{context}', context.accusative)
  const setup = [
    `Я снова сверилась с записями, найденными ${anchor}. Передо мной — ${stageEvidence}.`,
    `На этот раз несоответствие нашлось ${anchor}. Рядом лежит ${stageEvidence}.`,
    `Ладно, без лишних кругов. Вот улика, найденная ${anchor}: ${stageEvidence}.`,
    `Я пока не делаю выводов. Новая улика лежит ${anchor}: ${stageEvidence}.`,
  ][(storyIndex + stage) % 4]!
  const choices = four(
    Array.from({ length: branchCount }, (_, choiceBranch) =>
      makeChoice(
        storyId,
        storyIndex,
        stage,
        choiceBranch,
        `${nodeId}.reaction.${choiceBranch + 1}`,
      ),
    ),
  )
  const memoryKey = `${storyId}.memory.lastIntent`
  const fallbackText = `${setup} ${prompt}`
  const messageVariants = [
    ...choiceIntents.map(([, intent]) => ({
      variantId: `${nodeId}.after-${intent}`,
      priority: 10,
      when: { op: 'hasMemory' as const, key: memoryKey, value: intent },
      messages: [
        message(
          `${nodeId}.message.after-${intent}`,
          character.characterId,
          `${intentCallbacks[intent]!(context)} ${fallbackText}`,
        ),
      ],
    })),
    {
      variantId: `${nodeId}.default`,
      priority: 0,
      when: { op: 'all' as const, args: [] },
      messages: [
        message(`${nodeId}.message`, character.characterId, fallbackText),
      ],
    },
  ]
  return {
    nodeId,
    type: 'decision',
    sceneId: `${storyId}.scene.main`,
    onEnterEffects: [],
    messageVariants,
    choiceSlots: choices.map((candidate, choiceBranch) => ({
      slot: (choiceBranch + 1) as 1 | 2 | 3 | 4,
      candidates: [candidate],
    })),
    checkpointPolicy:
      stage === 0 ? 'before' : stage === stageCount - 1 ? 'after' : 'none',
    editorial: editorial(character.characterId),
  }
}

const makeEnding = (
  storyId: string,
  character: Character,
  storyIndex: number,
  choiceBranch: number,
): ContentNode => {
  const firstName = character.name.split(' ')[0] ?? character.name
  const anchor = anchorForStory(storyIndex)
  const endingTitles = [
    'Факты сошлись',
    'На этом остановимся',
    'Проверка вдвоём',
    'Выводы подождут',
  ] as const
  const nodeId = endingNodeId(storyId, choiceBranch)
  const context =
    decisionContexts[choiceBranch % decisionContexts.length]![choiceBranch]!
  return {
    nodeId,
    type: 'ending',
    sceneId: `${storyId}.scene.main`,
    endingId: `${storyId}.outcome.${choiceBranch + 1}`,
    title: `${character.name}: ${endingTitles[choiceBranch]}`,
    messages: [
      message(
        `${nodeId}.message`,
        character.characterId,
        [
          `Удалось проверить ${context.accusative}. Материалы, найденные ${anchor}, собраны вместе; теперь понятно, что делать дальше.`,
          `По поводу ${context.genitive} договорились не спешить. ${firstName} сохранит записи, найденные ${anchor}, и вернётся к ним, когда появятся новые факты.`,
          `Удалось разобрать ${context.accusative} вдвоём. ${firstName} сохранила записи, найденные ${anchor}, и составила список дальнейших проверок.`,
          `Решение по поводу ${context.genitive} отложили до новых фактов. Исходники, найденные ${anchor}, остались без изменений.`,
        ][choiceBranch]!,
        80,
      ),
    ],
    epilogueFacts: [
      [
        `Проверенные материалы, найденные ${anchor}, остались под рукой; сомнительные детали отмечены отдельно.`,
        `В разговоре зафиксировали, к чему пока не возвращаются. Записи, найденные ${anchor}, сохранены для следующей проверки.`,
        `${firstName} проверила записи, найденные ${anchor}, вместе с собеседником и знает, с чего продолжить.`,
        `Вывод отложили до новой проверки; исходники, найденные ${anchor}, сохранили без изменений.`,
      ][choiceBranch]!,
    ],
    editorial: editorial(character.characterId),
  }
}

const makeStoryNodes = (
  storyId: string,
  character: Character,
  storyIndex: number,
  stageCount: number,
): ContentNode[] => {
  const nodes: ContentNode[] = []
  for (let stage = 0; stage < stageCount; stage += 1) {
    const decision = makeDecision(
      storyId,
      character,
      storyIndex,
      stage,
      stageCount,
    )
    nodes.push(decision)
    for (let choiceBranch = 0; choiceBranch < branchCount; choiceBranch += 1) {
      const reactionId = `${decision.nodeId}.reaction.${choiceBranch + 1}`
      const nextNodeId =
        stage + 1 < stageCount
          ? decisionIdForStage(storyId, stage + 1)
          : endingNodeId(storyId, choiceBranch)
      const contextRow =
        decisionContexts[stage % decisionContexts.length] ??
        decisionContexts[0]!
      const context = contextRow[choiceBranch] ?? contextRow[0]
      const anchor = anchorForStory(storyIndex)
      const stageEvidence = stageEvidenceFor(stage)
      nodes.push({
        nodeId: reactionId,
        type: 'reaction',
        sceneId: `${storyId}.scene.main`,
        messages: [
          message(
            `${reactionId}.message`,
            character.characterId,
            [
              `«Давай начнём с проверки ${context.genitive}», — говорит ${character.name.split(' ')[0] ?? character.name}. Она ещё раз сверяет записи, найденные ${anchor}. Рядом лежит ${stageEvidence}.`,
              `«Сначала договоримся, чего не касаемся; ${withRussianS(context.instrumental)} разберёмся отдельно», — отвечает ${character.name.split(' ')[0] ?? character.name}, не убирая материалы, найденные ${anchor}. Рядом лежит ${stageEvidence}.`,
              `«Хорошо, вдвоём будет быстрее. Разберём ${context.accusative}», — говорит ${character.name.split(' ')[0] ?? character.name}, раскладывая материалы, найденные ${anchor}. Рядом лежит ${stageEvidence}.`,
              `«Сначала сверим ${context.accusative}, потом решим, что это значит», — говорит ${character.name.split(' ')[0] ?? character.name}, помечая записи, найденные ${anchor}. Рядом лежит ${stageEvidence}.`,
            ][choiceBranch]!,
            100,
          ),
        ],
        nextNodeId,
        effects: [],
        editorial: editorial(character.characterId),
      })
    }
  }
  for (let choiceBranch = 0; choiceBranch < branchCount; choiceBranch += 1) {
    nodes.push(makeEnding(storyId, character, storyIndex, choiceBranch))
  }
  return nodes
}

export function generateBulkFixtureContentPackage(
  options: BulkFixtureOptions = {},
): ContentPackage {
  const storyCount = options.storyCount ?? BULK_FIXTURE_DEFAULTS.storyCount
  const stageCount = options.stageCount ?? BULK_FIXTURE_DEFAULTS.stageCount
  if (!Number.isInteger(storyCount) || storyCount < 1) {
    throw new Error('Bulk fixture storyCount must be a positive integer')
  }
  if (
    !Number.isInteger(stageCount) ||
    stageCount < BULK_FIXTURE_DEFAULTS.stageCount
  ) {
    throw new Error(
      `Bulk fixture stageCount must be an integer >= ${BULK_FIXTURE_DEFAULTS.stageCount}`,
    )
  }

  const characters = Array.from({ length: storyCount }, (_, index) =>
    makeCharacter(index),
  )
  const stories = characters.map((character, index) =>
    makeStory(index, character, stageCount),
  )
  const episodes = stories.map(story => ({
    episodeId: story.episodeIds[0]!,
    storyId: story.storyId,
    title: `${story.title} · эпизод 1`,
    ordinal: 1,
    entryNodeId: `${story.storyId}.decision.00.root`,
    downloadBytes: 1_048_576,
    isBundled: true,
    checkpointIds: [],
  }))
  const nodes = stories.flatMap((story, index) =>
    makeStoryNodes(story.storyId, characters[index]!, index, stageCount),
  )
  return {
    manifest: {
      packId: 'pack.ru.bulk.fixture',
      locale: 'ru-RU',
      schemaVersion: 1,
      contentVersion: '0.2.4',
      buildId: 'ru-bulk-fixture-2026.08.24.3',
      minEngineVersion: '1.0.0',
      maxEngineVersion: '1.x',
      createdAt: '2026-08-24T00:00:00.000Z',
      checksum: 'sha256:development-bulk-fixture',
      signature: 'ed25519:development-bulk-fixture',
    },
    characters,
    stories,
    episodes,
    nodes,
    warnings: [],
    assets: makeAssets(stories.map(story => story.storyId)),
  }
}
