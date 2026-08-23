import type {
  Character,
  ChoiceCandidate,
  ContentAsset,
  ContentNode,
  ContentPackage,
  DecisionNode,
  NarrativeMessage,
} from '@chartalk/content-schema'

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
    `После разговора о границе я убрала лишнее и оставила только ${context.accusative}.`,
  'offer-alliance': context =>
    `Хорошо, что ты остался рядом. Теперь можно спокойно посмотреть на ${context.accusative}.`,
  'hold-question': context =>
    `Мы не будем спешить с выводом — сначала сверим ${context.accusative}.`,
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
    'Проверим {context}: вот зацепка — {clue}.',
    'Обозначим границу и проверим {context}: {clue}.',
    'Я рядом. Разберём {context}: {clue}.',
    'Не будем рубить с плеча — разберём {context}: {clue}.',
  ],
  [
    'Покажи исходник. Сверим {context}: {clue}.',
    'Стоп. Граница важнее: проверим {context} — {clue}.',
    'Давай по шагам. Разберём {context}: {clue}.',
    'Пока рано ставить точку. Проверим {context}: {clue}.',
  ],
  [
    'Что мы знаем наверняка? Сверим {context}: {clue}.',
    'Сначала разберём {context}: {clue}.',
    'Если хочешь, я останусь. Разберём {context}: {clue}.',
    'Давай возьмём паузу. Проверим {context}: {clue}.',
  ],
  [
    'Давай сверим источник и {context}: {clue}.',
    'Мне нужна граница. Сначала проверим {context}: {clue}.',
    'Я никуда не спешу. Разберём {context}: {clue}.',
    'Оставим вопрос открытым. Проверим {context}: {clue}.',
  ],
  [
    'Проверим {context}: вот зацепка — {clue}.',
    'Скажу прямо: нужна пауза. Проверим {context}: {clue}.',
    'Давай держаться рядом. Разберём {context}: {clue}.',
    'Не будем додумывать. Посмотрим на {context}: {clue}.',
  ],
  [
    'Уточним одну вещь: {context}. Начнём с {clue}.',
    'Граница ясна. Теперь проверим {context}: {clue}.',
    'Я готова выслушать. Начнём с {context}: {clue}.',
    'Возьмём минуту. Проверим {context}: {clue}.',
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
      accusative: 'границу',
      genitive: 'границы',
      instrumental: 'границей',
      about: 'границе',
    },
    {
      accusative: 'союзника',
      genitive: 'союзника',
      instrumental: 'союзником',
      about: 'союзнике',
    },
    {
      accusative: 'следующий шаг',
      genitive: 'следующего шага',
      instrumental: 'следующим шагом',
      about: 'следующем шаге',
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
      accusative: 'разговор',
      genitive: 'разговора',
      instrumental: 'разговором',
      about: 'разговоре',
    },
    {
      accusative: 'маршрут',
      genitive: 'маршрута',
      instrumental: 'маршрутом',
      about: 'маршруте',
    },
    {
      accusative: 'тишину',
      genitive: 'тишины',
      instrumental: 'тишиной',
      about: 'тишине',
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
      accusative: 'свидетеля',
      genitive: 'свидетеля',
      instrumental: 'свидетелем',
      about: 'свидетеле',
    },
    {
      accusative: 'выход',
      genitive: 'выхода',
      instrumental: 'выходом',
      about: 'выходе',
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
      accusative: 'своё время',
      genitive: 'своего времени',
      instrumental: 'своим временем',
      about: 'своём времени',
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
      accusative: 'утро',
      genitive: 'утра',
      instrumental: 'утром',
      about: 'утре',
    },
    {
      accusative: 'разговор начистоту',
      genitive: 'разговора начистоту',
      instrumental: 'разговором начистоту',
      about: 'разговоре начистоту',
    },
    {
      accusative: 'помощь',
      genitive: 'помощи',
      instrumental: 'помощью',
      about: 'помощи',
    },
    {
      accusative: 'паузу',
      genitive: 'паузы',
      instrumental: 'паузой',
      about: 'паузе',
    },
  ],
] as const
const decisionPrompts = [
  'Сначала проверим {context} — без догадок.',
  'Меня не отпускает {context}. Как к этому подступиться?',
  'Нельзя упустить {context}. С чего начнём?',
  'Если первая версия не подтвердится, что проверим следующим?',
] as const
const decisionBeats = [
  [
    'Сначала — то, что видно.',
    'Начнём с простого вопроса.',
    'Дай мне минуту, я соберусь.',
    'Есть вариант не торопиться.',
  ],
  [
    'Первый след уже нашёлся.',
    'Теперь важны детали.',
    'Я хочу проверить одну вещь.',
    'Один вопрос всё ещё висит.',
  ],
  [
    'Дальше будет сложнее.',
    'Здесь легко сделать неверный вывод.',
    'Можно выбрать более тихий путь.',
    'Но оставим место для сомнений.',
  ],
  [
    'Появилась новая зацепка.',
    'Теперь стоит говорить прямо.',
    'Я не хочу проходить это одна.',
    'Сначала сверим версии.',
  ],
  [
    'Мы подошли к неприятной части.',
    'Факты уже не спрячешь.',
    'Мне нужна передышка, но не отказ.',
    'И всё-таки решать придётся.',
  ],
  [
    'Остался последний вопрос.',
    'Финал зависит от одной детали.',
    'Я готова услышать ответ.',
    'Сделаем последний шаг спокойно.',
  ],
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
  const place = anchorPlaces[storyIndex % anchorPlaces.length]!
  const detail =
    choiceAnchorDetails[
      Math.floor(storyIndex / anchorPlaces.length) % choiceAnchorDetails.length
    ]!
  return `${place}, ${detail}`
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
  /^[сз][бвгджзклмнпрстфхцчшщ]/i.test(phrase) ? `со ${phrase}` : `с ${phrase}`

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
  const theme = themes[index % themes.length]!
  const anchor = anchorForStory(index)
  const genre = genres[index % genres.length]!
  const dynamic = dynamics[index % dynamics.length]!
  const hooks = [
    `${firstName} не любит делать выводы на ходу: тема «${theme}» оставила слишком много белых пятен.`,
    `Смена закончилась, а ${anchor} нашлась странная деталь.`,
    `${firstName} привыкла проверять мелочи. Сегодня эта привычка привела её к теме «${theme}».`,
    `В истории «${theme}» ${firstName} больше всего боится поспешного ответа.`,
    `Когда ${firstName} пишет «есть минутка?», это значит: тема «${theme}» снова требует разговора.`,
    `Она нашла не ответ, а новую зацепку: ${anchor}.`,
  ] as const
  const hookTails = [
    ' Похоже, без разговора не обойтись.',
    ' Сегодня лучше не спешить.',
    ' Сначала стоит выслушать обе стороны.',
    ' Дальше всё решит один честный вопрос.',
    ' Такая деталь ещё вернётся.',
    ' Тут важно оставить место для сомнений.',
    ' Иногда самый прямой путь начинается с паузы.',
  ] as const
  const descriptions = [
    `Авторская история о разговоре, который начинается ${anchor} и постепенно меняет доверие, границы и следующий шаг.`,
    `Сначала это обычный разговор о теме «${theme}». Потом появляется деталь, которую уже не получится не заметить: ${anchor}.`,
    `История о двух людях, которым приходится сверять факты и границы ${anchor}, не решая всё друг за друга.`,
    `Одна странная деталь, один поздний разговор и несколько способов не сделать вывод за другого — так начинается эта история ${anchor}.`,
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
    `Вокруг темы «${theme}» всё начинается ${anchor}. В этой истории важен не «правильный» ответ, а выбранный вами способ быть рядом.`,
    `${stem} — история о том, как одна деталь, найденная ${anchor}, меняет разговор и оставляет место для собственного решения.`,
    `У темы «${theme}» нет одного правильного финала. Всё начинается ${anchor}, а дальше важны факты, границы и то, что вы решите сказать.`,
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
    assetId: 'portrait.vera',
    kind: 'portrait',
    path: 'portraits/vera.png',
    checksum:
      'sha256:e24cfbc0733bffbf248f95fa37c4bab6bd7bd53c75f8761ab655f763a53f524a',
    width: 1254,
    height: 1254,
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
  const firstName = character.name.split(' ')[0] ?? character.name
  const anchor = anchorForStory(storyIndex)
  const stageEvidence = stageEvidenceFor(stage)
  const context = decisionContexts[stage % decisionContexts.length]![0]
  const prompt = decisionPrompts[
    (storyIndex + stage) % decisionPrompts.length
  ]!.replace('{context}', context.accusative)
  const beat = decisionBeats[stage % decisionBeats.length]![0]
  const setup = [
    `${firstName}, я снова сверилась с записями ${anchor}.`,
    `На этот раз деталь нашлась ${anchor}.`,
    `Ладно, давай без лишних кругов. Записи ${anchor} перед нами.`,
    `Я пока не делаю выводов. Записи ${anchor} перед нами — слишком многое указывает на ${context.accusative}.`,
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
  const fallbackText = `${beat} ${setup} Рядом лежит ${stageEvidence}. ${prompt}`
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
  const theme = themes[storyIndex % themes.length]!
  const firstName = character.name.split(' ')[0] ?? character.name
  const anchor = anchorForStory(storyIndex)
  const endingTitles = [
    'Факты на столе',
    'Граница обозначена',
    'Рядом, без лишних слов',
    'Пауза перед следующим шагом',
  ] as const
  const endingMoments = [
    'после долгой проверки деталей',
    'после названной границы',
    'после нескольких честных разговоров',
    'после последнего вопроса',
  ] as const
  const nodeId = endingNodeId(storyId, choiceBranch)
  const context =
    decisionContexts[choiceBranch % decisionContexts.length]![choiceBranch]!
  return {
    nodeId,
    type: 'ending',
    sceneId: `${storyId}.scene.main`,
    endingId: `${storyId}.outcome.${choiceBranch + 1}`,
    title: `${character.name}: ${endingTitles[choiceBranch]} · ${context.accusative} · ${endingMoments[choiceBranch]} · ${theme}`,
    messages: [
      message(
        `${nodeId}.message`,
        character.characterId,
        [
          `К финалу главный вопрос — «${context.accusative}» — больше не висит в воздухе. Все записи, найденные ${anchor}, собраны вместе, и можно двигаться дальше.`,
          `Вы обозначили границу и не стали торопить ответ по поводу ${context.genitive}. ${firstName} оставляет записи ${anchor} и предлагает вернуться к ним, когда появятся новые факты.`,
          `Вы выбрали идти рядом: вопрос «${context.accusative}» разобран по шагам, а следующий разговор начинается ${anchor}.`,
          `Пауза оказалась решением сама по себе. После разговора о ${context.about} у этой истории есть план, записи ${anchor} и право не отвечать сию секунду.`,
        ][choiceBranch]!,
        80,
      ),
    ],
    epilogueFacts: [
      `В этой истории вы выбрали «${choiceIntents[choiceBranch]![0]}» и разобрались ${withRussianS(context.instrumental)}: записи ${anchor} остались под рукой, а следующий шаг — за вами.`,
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
              `«Давай начнём с проверки ${context.genitive}», — говорит ${character.name.split(' ')[0] ?? character.name}. Она ещё раз сверяет записи ${anchor}. Рядом лежит ${stageEvidence}.`,
              `«Границу лучше назвать прямо, а ${withRussianS(context.instrumental)} разобраться отдельно», — отвечает ${character.name.split(' ')[0] ?? character.name}, не убирая записи ${anchor}. Рядом лежит ${stageEvidence}.`,
              `«Спасибо, что не отмахиваешься. Я рядом: спокойно разберём ${context.accusative}», — говорит ${character.name.split(' ')[0] ?? character.name}, раскладывая записи ${anchor}. Рядом лежит ${stageEvidence}.`,
              `«Сначала сверим ${context.accusative}, потом решим, что это значит», — говорит ${character.name.split(' ')[0] ?? character.name}, закрывая папку ${anchor}. Рядом лежит ${stageEvidence}.`,
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
      contentVersion: '0.2.2',
      buildId: 'ru-bulk-fixture-2026.08.23.3',
      minEngineVersion: '1.0.0',
      maxEngineVersion: '1.x',
      createdAt: '2026-08-23T00:00:00.000Z',
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
