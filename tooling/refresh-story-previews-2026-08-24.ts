import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

import sharp from 'sharp'

import {
  storyPreviewDefinitions,
  type StoryPreviewCategory,
  type StoryPreviewDefinition,
} from '../packages/test-fixtures/src/story-previews.generated'

interface Replacement {
  storyId: string
  sourceId: string
  pageSlug: string
  category: StoryPreviewCategory
  altText: string
  cropPosition?: 'north' | 'east'
}

const replacements: readonly Replacement[] = [
  // Featured stories and previously generic character-led covers.
  {
    storyId: 'story.ira.after-deadline',
    sourceId: '9062771',
    pageSlug: 'woman-sitting-in-front-of-a-desk-reading-the-documents-9062771',
    category: 'woman',
    altText:
      'Женщина при свете настольной лампы сравнивает документы в ночном офисе.',
  },
  {
    storyId: 'story.dina.three-knocks',
    sourceId: '4409969',
    pageSlug:
      'unrecognizable-sound-engineer-installing-software-on-desktop-computer-at-home-4409969',
    category: 'woman',
    altText: 'Женщина проверяет звуковую запись за пультом с микрофоном.',
  },
  {
    storyId: 'story.bulk.0001',
    sourceId: '6549632',
    pageSlug: 'a-woman-writing-on-a-notebook-6549632',
    category: 'woman',
    altText:
      'Женщина работает с документами среди ящиков старого архивного каталога.',
  },
  {
    storyId: 'story.bulk.0005',
    sourceId: '9841340',
    pageSlug: 'rear-view-on-womans-hand-holding-letters-on-table-9841340',
    category: 'woman',
    altText: 'Женщина разбирает письма и газету рядом с настольным телефоном.',
  },
  {
    storyId: 'story.bulk.0032',
    sourceId: '17537616',
    pageSlug: 'reflection-of-woman-taking-pictures-in-train-window-17537616',
    category: 'woman',
    altText: 'В пустом ночном вагоне в окне отражается женщина с камерой.',
  },
  {
    storyId: 'story.bulk.0047',
    sourceId: '35600864',
    pageSlug: 'woman-on-night-bus-with-green-interior-35600864',
    category: 'woman',
    altText: 'Женщина едет в ночном автобусе, освещённом зелёными огнями.',
  },
  {
    storyId: 'story.bulk.0092',
    sourceId: '28892122',
    pageSlug: 'woman-admiring-vintage-camera-collection-indoors-28892122',
    category: 'woman',
    altText: 'Женщина рассматривает коллекцию старых фотоаппаратов на полках.',
  },
  {
    storyId: 'story.bulk.0093',
    sourceId: '8007597',
    pageSlug: 'woman-opening-her-locker-8007597',
    category: 'woman',
    altText: 'Женщина проверяет открытый пустой шкафчик.',
  },
  {
    storyId: 'story.bulk.0095',
    sourceId: '6549375',
    pageSlug: 'student-looking-at-an-archive-drawer-6549375',
    category: 'woman',
    altText: 'Женщина ищет карточку в ящике библиотечного архива.',
  },
  {
    storyId: 'story.bulk.0109',
    sourceId: '20267270',
    pageSlug: 'woman-waiting-at-a-bus-stop-at-night-20267270',
    category: 'woman',
    altText: 'Женщина ждёт автобус на освещённой ночной остановке.',
  },
  {
    storyId: 'story.bulk.0121',
    sourceId: '17749317',
    pageSlug: 'woman-and-train-at-railway-station-17749317',
    category: 'woman',
    altText: 'Женщина ждёт приближающийся поезд под станционными часами.',
  },
  {
    storyId: 'story.bulk.0137',
    sourceId: '6924667',
    pageSlug: 'a-woman-reading-a-letter-6924667',
    category: 'woman',
    altText: 'Женщина внимательно читает рукописное письмо в комнате.',
  },
  {
    storyId: 'story.bulk.0157',
    sourceId: '37154349',
    pageSlug: 'woman-sitting-by-seaside-with-lighthouse-view-37154349',
    category: 'woman',
    altText: 'Женщина сидит на набережной напротив далёкого маяка.',
  },
  {
    storyId: 'story.bulk.0165',
    sourceId: '4240509',
    pageSlug: 'woman-having-a-phone-call-in-home-office-4240509',
    category: 'woman',
    altText: 'Женщина отвечает на звонок за рабочим столом у окна.',
    cropPosition: 'north',
  },
  {
    storyId: 'story.bulk.0168',
    sourceId: '37713503',
    pageSlug: 'elegant-woman-writing-by-window-in-soft-light-37713503',
    category: 'woman',
    altText: 'Женщина пишет письмо у светлого окна.',
  },
  {
    storyId: 'story.bulk.0207',
    sourceId: '28683726',
    pageSlug: 'stylish-woman-on-dock-with-urban-waterfront-view-28683726',
    category: 'woman',
    altText: 'Женщина стоит на речном причале на фоне городских зданий.',
  },
  {
    storyId: 'story.bulk.0217',
    sourceId: '29801152',
    pageSlug: 'woman-with-umbrella-at-night-bus-stop-29801152',
    category: 'woman',
    altText: 'Женщина с зонтом ждёт на ночной автобусной остановке.',
  },
  {
    storyId: 'story.bulk.0225',
    sourceId: '7014250',
    pageSlug:
      'smiling-young-woman-checking-images-on-negatives-in-light-studio-7014250',
    category: 'woman',
    altText: 'Женщина рассматривает плёночные негативы у окна в студии.',
    cropPosition: 'east',
  },
  {
    storyId: 'story.bulk.0227',
    sourceId: '5989840',
    pageSlug:
      'woman-standing-on-a-balcony-on-a-courtyard-and-looking-at-view-5989840',
    category: 'woman',
    altText: 'Женщина с балкона смотрит во двор старого дома.',
  },
  {
    storyId: 'story.bulk.0238',
    sourceId: '31321191',
    pageSlug:
      'young-woman-walking-in-european-alley-with-shop-reflection-31321191',
    category: 'woman',
    altText: 'Женщина проходит мимо витрины и афиш в городском переулке.',
  },
  {
    storyId: 'story.bulk.0239',
    sourceId: '14452735',
    pageSlug: 'artisan-at-work-in-store-window-14452735',
    category: 'woman',
    altText: 'Женщина работает в мастерской за большим окном-витриной.',
  },

  // Office, investigation, schedule, and password stories.
  {
    storyId: 'story.asya.seven-minutes',
    sourceId: '30248067',
    pageSlug: 'busy-office-woman-on-phone-with-computers-30248067',
    category: 'woman',
    altText: 'Женщина работает ночью за столом с телефонами и мониторами.',
  },
  {
    storyId: 'story.bulk.0057',
    sourceId: '11941525',
    pageSlug:
      'portrait-of-woman-holding-vintage-camera-in-front-of-her-face-11941525',
    category: 'woman',
    altText: 'Женщина держит перед собой старый плёночный фотоаппарат.',
  },
  {
    storyId: 'story.bulk.0059',
    sourceId: '36765709',
    pageSlug: 'woman-holding-vintage-camera-in-indoor-setting-36765709',
    category: 'woman',
    altText: 'Женщина держит старый фотоаппарат в комнате для встречи.',
  },
  {
    storyId: 'story.bulk.0069',
    sourceId: '35552438',
    pageSlug: 'vintage-film-camera-portrait-of-woman-35552438',
    category: 'woman',
    altText:
      'Женщина рассматривает плёночный фотоаппарат в полутёмной комнате.',
  },
  {
    storyId: 'story.bulk.0119',
    sourceId: '32346391',
    pageSlug: 'moody-indoor-portrait-with-vintage-camera-32346391',
    category: 'woman',
    altText: 'Женщина с плёночным фотоаппаратом стоит в тёмном коридоре.',
  },
  {
    storyId: 'story.bulk.0149',
    sourceId: '30215686',
    pageSlug: 'woman-working-late-on-laptop-in-dark-office-30215686',
    category: 'woman',
    altText: 'Женщина проверяет ноутбук в тёмном офисе поздно вечером.',
  },
  {
    storyId: 'story.bulk.0169',
    sourceId: '3791242',
    pageSlug: 'pondering-female-secretary-picking-folder-in-workplace-3791242',
    category: 'woman',
    altText: 'Женщина ищет нужную папку среди архивных полок.',
  },
  {
    storyId: 'story.bulk.0181',
    sourceId: '14304594',
    pageSlug: 'woman-holding-a-vintage-camera-14304594',
    category: 'woman',
    altText: 'Женщина рассматривает отражение со старым фотоаппаратом в руках.',
  },
  {
    storyId: 'story.bulk.0185',
    sourceId: '29932832',
    pageSlug: 'portrait-of-woman-holding-vintage-camera-indoors-29932832',
    category: 'woman',
    altText: 'Женщина держит старый плёночный фотоаппарат в помещении.',
  },
  {
    storyId: 'story.bulk.0187',
    sourceId: '12903157',
    pageSlug: 'focused-woman-working-in-office-late-12903157',
    category: 'woman',
    altText: 'Женщина сосредоточенно работает в офисе поздней ночью.',
  },
  {
    storyId: 'story.bulk.0201',
    sourceId: '33010399',
    pageSlug: 'woman-taking-photo-with-vintage-camera-indoors-33010399',
    category: 'woman',
    altText: 'Женщина проверяет старый фотоаппарат в комнате.',
  },
  {
    storyId: 'story.bulk.0211',
    sourceId: '36713414',
    pageSlug: 'businesswoman-using-smartphone-in-office-at-night-36713414',
    category: 'woman',
    altText: 'Женщина проверяет сообщение на телефоне в ночном офисе.',
  },
  {
    storyId: 'story.bulk.0219',
    sourceId: '8872552',
    pageSlug: 'a-woman-reading-documents-on-a-folder-8872552',
    category: 'woman',
    altText: 'Женщина читает архивные документы при свете настольной лампы.',
  },

  // Film, darkroom, and old-camera stories.
  {
    storyId: 'story.bulk.0007',
    sourceId: '10276051',
    pageSlug: 'woman-with-negative-in-darkroom-10276051',
    category: 'woman',
    altText: 'Женщина рассматривает плёночный негатив при красном свете.',
  },
  {
    storyId: 'story.bulk.0009',
    sourceId: '10276049',
    pageSlug: 'woman-working-in-darkroom-10276049',
    category: 'woman',
    altText: 'Женщина печатает фотографии в тёмной фотолаборатории.',
  },
  {
    storyId: 'story.bulk.0061',
    sourceId: '9154461',
    pageSlug: 'grayscale-photo-of-a-woman-using-a-film-camera-9154461',
    category: 'woman',
    altText: 'Женщина снимает на старый плёночный фотоаппарат.',
  },
  {
    storyId: 'story.bulk.0131',
    sourceId: '10273454',
    pageSlug:
      'woman-in-a-darkroom-with-hanging-cut-films-in-the-background-10273454',
    category: 'woman',
    altText: 'Женщина стоит среди проявленных плёнок в фотолаборатории.',
  },

  // Letters, folders, receipts, and archive indexes.
  {
    storyId: 'story.bulk.0013',
    sourceId: '4792674',
    pageSlug:
      'crop-unrecognizable-woman-opening-envelope-above-desk-with-twine-4792674',
    category: 'woman',
    altText: 'Женщина открывает конверт над рабочим столом.',
  },
  {
    storyId: 'story.bulk.0027',
    sourceId: '7319305',
    pageSlug:
      'crop-unrecognizable-woman-placing-blank-paper-in-envelope-7319305',
    category: 'woman',
    altText: 'Женщина кладёт записку в конверт на деревянном столе.',
  },
  {
    storyId: 'story.bulk.0029',
    sourceId: '4959926',
    pageSlug: 'close-up-of-woman-hands-holding-bill-4959926',
    category: 'woman',
    altText: 'Женщина держит длинную бумажную квитанцию.',
  },
  {
    storyId: 'story.bulk.0045',
    sourceId: '19872945',
    pageSlug: 'a-card-catalogue-in-a-library-19872945',
    category: 'woman',
    altText: 'Женщина изучает ящики старого библиотечного каталога.',
  },
  {
    storyId: 'story.bulk.0051',
    sourceId: '8297154',
    pageSlug: 'a-woman-examining-a-folder-of-documents-8297154',
    category: 'woman',
    altText: 'Женщина внимательно читает документы из папки.',
  },
  {
    storyId: 'story.bulk.0067',
    sourceId: '10751389',
    pageSlug: 'person-in-white-shirt-holding-and-reading-a-letter-10751389',
    category: 'woman',
    altText: 'Женщина держит и читает рукописное письмо.',
  },
  {
    storyId: 'story.bulk.0076',
    sourceId: '30143689',
    pageSlug: 'woman-walking-in-vintage-library-card-catalog-room-30143689',
    category: 'woman',
    altText: 'Женщина идёт между рядами старых архивных каталогов.',
  },
  {
    storyId: 'story.bulk.0091',
    sourceId: '7545333',
    pageSlug: 'person-holding-a-receipt-7545333',
    category: 'object',
    altText: 'Руки сортируют несколько бумажных квитанций на столе.',
  },
  {
    storyId: 'story.bulk.0129',
    sourceId: '11259801',
    pageSlug:
      'girl-in-old-fashioned-dress-standing-in-library-holding-books-11259801',
    category: 'woman',
    altText: 'Женщина держит архивные папки у книжных полок.',
  },
  {
    storyId: 'story.bulk.0141',
    sourceId: '5899176',
    pageSlug: 'woman-putting-a-letter-in-an-envelope-5899176',
    category: 'woman',
    altText: 'Женщина складывает письмо в конверт за рабочим столом.',
  },
  {
    storyId: 'story.bulk.0213',
    sourceId: '31570982',
    pageSlug: 'vintage-style-woman-reading-in-a-library-31570982',
    category: 'woman',
    altText: 'Женщина читает старую запись в тихой библиотеке.',
  },
  {
    storyId: 'story.bulk.0231',
    sourceId: '6549365',
    pageSlug: 'woman-reading-a-book-between-archive-drawers-6549365',
    category: 'woman',
    altText: 'Женщина читает между рядами архивных ящиков.',
  },

  // Metro, train, bus-stop, and schedule stories.
  {
    storyId: 'story.bulk.0019',
    sourceId: '7460441',
    pageSlug: 'woman-waiting-in-a-subway-station-7460441',
    category: 'woman',
    altText: 'Женщина ждёт на тускло освещённой платформе метро.',
  },
  {
    storyId: 'story.bulk.0025',
    sourceId: '37002894',
    pageSlug: 'woman-sitting-alone-in-a-bus-stop-at-night-37002894',
    category: 'woman',
    altText: 'Женщина проверяет телефон на ночной автобусной остановке.',
  },
  {
    storyId: 'story.bulk.0035',
    sourceId: '17225406',
    pageSlug: 'woman-waiting-for-a-train-17225406',
    category: 'woman',
    altText: 'Женщина ждёт поезд на платформе под станционными часами.',
  },
  {
    storyId: 'story.bulk.0073',
    sourceId: '7398382',
    pageSlug: 'empty-train-during-night-7398382',
    category: 'interior',
    altText: 'Пустой вагон поезда освещён ночью.',
  },
  {
    storyId: 'story.bulk.0089',
    sourceId: '28443579',
    pageSlug: 'man-waiting-at-night-bus-stop-with-rain-28443579',
    category: 'man',
    altText: 'Мужчина проверяет телефон на мокрой ночной остановке.',
  },
  {
    storyId: 'story.bulk.0096',
    sourceId: '8658854',
    pageSlug: 'women-talking-on-empty-train-8658854',
    category: 'woman',
    altText: 'Две женщины разговаривают в почти пустом вагоне.',
  },
  {
    storyId: 'story.bulk.0147',
    sourceId: '17877328',
    pageSlug: 'woman-standing-on-the-subway-station-platform-17877328',
    category: 'woman',
    altText: 'Женщина стоит на ночной платформе перед поездом метро.',
  },
  {
    storyId: 'story.bulk.0153',
    sourceId: '4968388',
    pageSlug: 'a-person-holding-a-wallet-4968388',
    category: 'woman',
    altText: 'Женщина достаёт и проверяет квитанции из кошелька.',
  },
  {
    storyId: 'story.bulk.0159',
    sourceId: '6049048',
    pageSlug: 'people-waiting-for-train-on-the-platform-6049048',
    category: 'scene',
    altText: 'Пассажиры ждут прибывающий поезд на ночной платформе.',
  },
  {
    storyId: 'story.bulk.0182',
    sourceId: '11032069',
    pageSlug: 'a-person-waiting-at-a-subway-platform-11032069',
    category: 'scene',
    altText: 'Одинокий пассажир ждёт на тёмной платформе у рельсов.',
  },
  {
    storyId: 'story.bulk.0197',
    sourceId: '18454228',
    pageSlug: 'people-waiting-on-train-platform-at-night-18454228',
    category: 'scene',
    altText: 'Люди ждут поезд на тихой станции ночью.',
  },
  {
    storyId: 'story.bulk.0233',
    sourceId: '29027875',
    pageSlug: 'empty-train-interior-with-newspaper-at-night-29027875',
    category: 'interior',
    altText: 'В пустом ночном вагоне на сиденье лежит газета.',
  },

  // Keys, maps, routes, and unsigned voice messages.
  {
    storyId: 'story.bulk.0003',
    sourceId: '7634232',
    pageSlug: 'a-woman-s-hand-over-a-map-7634232',
    category: 'object',
    altText: 'Женская рука отмечает нужное место на бумажной карте.',
  },
  {
    storyId: 'story.bulk.0008',
    sourceId: '2187517',
    pageSlug: 'woman-holding-a-key-2187517',
    category: 'woman',
    altText: 'Женщина держит старинный ключ в полутёмном помещении.',
  },
  {
    storyId: 'story.bulk.0018',
    sourceId: '5622149',
    pageSlug: 'women-reading-map-5622149',
    category: 'woman',
    altText: 'Две женщины внимательно сверяют маршрут по бумажной карте.',
  },
  {
    storyId: 'story.bulk.0023',
    sourceId: '5965896',
    pageSlug:
      'black-woman-in-earphones-listening-to-music-and-texting-message-5965896',
    category: 'woman',
    altText: 'Женщина в наушниках слушает сообщение на телефоне.',
  },
  {
    storyId: 'story.bulk.0039',
    sourceId: '14182213',
    pageSlug: 'woman-holding-a-key-14182213',
    category: 'woman',
    altText: 'Женщина рассматривает необычный старинный ключ.',
  },
  {
    storyId: 'story.bulk.0043',
    sourceId: '20233772',
    pageSlug: 'woman-holding-a-map-20233772',
    category: 'woman',
    altText: 'Женщина указывает на отметку на развёрнутой карте.',
  },
  {
    storyId: 'story.bulk.0077',
    sourceId: '7579200',
    pageSlug: 'woman-holding-a-key-7579200',
    category: 'woman',
    altText: 'Женщина показывает связку ключей в квартире.',
  },
  {
    storyId: 'story.bulk.0103',
    sourceId: '4971273',
    pageSlug: 'a-person-holding-a-bunch-of-keys-4971273',
    category: 'woman',
    altText: 'Женщина держит связку ключей перед собой.',
  },
  {
    storyId: 'story.bulk.0167',
    sourceId: '20232075',
    pageSlug: 'woman-holding-a-map-in-a-forest-20232075',
    category: 'woman',
    altText: 'Женщина изучает развёрнутую карту с отметками.',
  },
  {
    storyId: 'story.bulk.0189',
    sourceId: '34576470',
    pageSlug: 'young-woman-adjusting-vintage-radio-in-cozy-room-34576470',
    category: 'woman',
    altText: 'Женщина настраивает старое радио в уютной комнате.',
  },

  // Opposite windows, faded posters, and the old cinema.
  {
    storyId: 'story.bulk.0011',
    sourceId: '8846941',
    pageSlug:
      'back-view-of-woman-looking-out-the-window-in-a-high-rise-residential-block-8846941',
    category: 'woman',
    altText: 'Женщина смотрит из окна на дома напротив.',
  },
  {
    storyId: 'story.bulk.0021',
    sourceId: '12891801',
    pageSlug: 'torn-poster-on-brick-wall-12891801',
    category: 'object',
    altText: 'На кирпичной стене висит выцветшая рваная афиша с женским лицом.',
  },
  {
    storyId: 'story.bulk.0053',
    sourceId: '9736943',
    pageSlug: 'a-woman-looking-through-the-window-9736943',
    category: 'woman',
    altText: 'Женщина задумчиво смотрит в окно городской квартиры.',
  },
  {
    storyId: 'story.bulk.0075',
    sourceId: '15920210',
    pageSlug: 'woman-in-apartment-windows-15920210',
    category: 'woman',
    altText: 'Женщина выглядывает из окна старого городского дома.',
  },
  {
    storyId: 'story.bulk.0083',
    sourceId: '11027038',
    pageSlug: 'close-up-shot-of-a-vandalized-wall-11027038',
    category: 'object',
    altText: 'На городской стене слоями отходит старая афиша.',
  },
  {
    storyId: 'story.bulk.0087',
    sourceId: '11027039',
    pageSlug: 'peeled-posters-on-concrete-wall-11027039',
    category: 'object',
    altText: 'На стене старого кинотеатра облупились бумажные афиши.',
  },
  {
    storyId: 'story.bulk.0115',
    sourceId: '14215450',
    pageSlug: 'woman-looking-through-window-in-apartment-14215450',
    category: 'woman',
    altText: 'Женщина стоит у большого окна и смотрит на город напротив.',
  },
  {
    storyId: 'story.bulk.0139',
    sourceId: '11363898',
    pageSlug: 'person-looking-outside-the-window-11363898',
    category: 'building',
    altText: 'Человек смотрит наружу из окна жилого дома.',
  },
  {
    storyId: 'story.bulk.0145',
    sourceId: '4373993',
    pageSlug: 'old-grunge-wall-with-scraps-of-posters-in-town-4373993',
    category: 'object',
    altText: 'На старой стене сохранились обрывки выцветших афиш.',
  },
  {
    storyId: 'story.bulk.0177',
    sourceId: '27067462',
    pageSlug: 'windows-of-gray-building-27067462',
    category: 'building',
    altText: 'Женщина видна в одном из окон серого жилого дома.',
  },
  {
    storyId: 'story.bulk.0203',
    sourceId: '15730774',
    pageSlug: 'woman-looking-out-of-house-window-15730774',
    category: 'woman',
    altText: 'Женщина смотрит из окна старого дома во двор напротив.',
  },
  {
    storyId: 'story.bulk.0215',
    sourceId: '5801647',
    pageSlug: 'a-ticket-on-the-lap-of-a-person-5801647',
    category: 'object',
    altText: 'Человек держит бумажный билет у себя на коленях.',
  },

  // Snow tracks and recorded conversations.
  {
    storyId: 'story.bulk.0024',
    sourceId: '37282196',
    pageSlug: 'snowy-night-street-scene-in-black-and-white-37282196',
    category: 'landscape',
    altText: 'Цепочка следов проходит по снегу вдоль ночной улицы.',
  },
  {
    storyId: 'story.bulk.0037',
    sourceId: '6954190',
    pageSlug: 'content-woman-recording-voice-message-6954190',
    category: 'woman',
    altText: 'Женщина записывает голос у студийного микрофона.',
  },
  {
    storyId: 'story.bulk.0055',
    sourceId: '5058972',
    pageSlug: 'view-of-a-bridge-and-footprints-in-the-snow-at-night-5058972',
    category: 'landscape',
    altText: 'Следы тянутся по снегу через освещённый ночной мост.',
  },
  {
    storyId: 'story.bulk.0099',
    sourceId: '19568107',
    pageSlug: 'female-singer-recording-in-a-studio-19568107',
    category: 'woman',
    altText: 'Женщина в наушниках проверяет запись у студийного микрофона.',
  },
  {
    storyId: 'story.bulk.0111',
    sourceId: '14540964',
    pageSlug: 'woman-during-recording-14540964',
    category: 'woman',
    altText: 'Женщина просматривает незавершённую запись в студии.',
  },
  {
    storyId: 'story.bulk.0161',
    sourceId: '6953663',
    pageSlug:
      'woman-in-casual-stylish-outfit-recording-voice-with-microphone-6953663',
    category: 'woman',
    altText: 'Женщина записывает голосовое сообщение у микрофона.',
  },
  {
    storyId: 'story.bulk.0235',
    sourceId: '7598558',
    pageSlug: 'a-woman-in-a-studio-7598558',
    category: 'woman',
    altText: 'Женщина в наушниках говорит в микрофон студии.',
  },

  // Lockers, corridors, courtyards, and waiting rooms.
  {
    storyId: 'story.bulk.0031',
    sourceId: '3902734',
    pageSlug: 'woman-in-black-tank-top-opening-locker-3902734',
    category: 'woman',
    altText: 'Женщина открывает один из жёлтых шкафчиков.',
  },
  {
    storyId: 'story.bulk.0113',
    sourceId: '19064368',
    pageSlug: 'woman-sitting-on-a-stool-in-the-corridor-19064368',
    category: 'woman',
    altText: 'Женщина сидит в тихом коридоре комнаты ожидания.',
  },
  {
    storyId: 'story.bulk.0117',
    sourceId: '10612264',
    pageSlug: 'cold-snow-light-landscape-10612264',
    category: 'scene',
    altText: 'Люди стоят у окна, за которым виден снег.',
  },
  {
    storyId: 'story.bulk.0133',
    sourceId: '17501537',
    pageSlug:
      'woman-walking-on-the-pavement-between-the-building-and-parking-lot-in-city-17501537',
    category: 'scene',
    altText: 'Женщина идёт через тихий двор жилого дома.',
  },
  {
    storyId: 'story.bulk.0155',
    sourceId: '5000221',
    pageSlug: 'a-woman-changing-in-a-locker-room-5000221',
    category: 'woman',
    altText: 'Женщина заглядывает в открытый шкафчик.',
  },
  {
    storyId: 'story.bulk.0171',
    sourceId: '18446450',
    pageSlug: 'chairs-in-an-empty-corridor-18446450',
    category: 'interior',
    altText: 'Одинокие стулья стоят в пустом тёмном коридоре.',
  },
  {
    storyId: 'story.bulk.0173',
    sourceId: '5941813',
    pageSlug: 'a-side-view-of-a-woman-standing-at-the-locker-room-5941813',
    category: 'woman',
    altText: 'Женщина проверяет содержимое шкафчика в полутёмной комнате.',
  },
  {
    storyId: 'story.bulk.0179',
    sourceId: '15186396',
    pageSlug: 'portrait-of-woman-behind-a-window-in-black-and-white-15186396',
    category: 'woman',
    altText: 'Женщина стоит у зимнего окна в тихой комнате ожидания.',
  },
  {
    storyId: 'story.bulk.0205',
    sourceId: '19306750',
    pageSlug: 'a-woman-at-work-19306750',
    category: 'woman',
    altText: 'Женщина заканчивает работу у рыночного прилавка ночью.',
  },
] as const

const root = resolve(import.meta.dirname, '..')
const previewDirectory = resolve(root, 'apps/mobile/assets/story-previews')
const definitionsPath = resolve(
  root,
  'packages/test-fixtures/src/story-previews.generated.ts',
)
const sourcesPath = resolve(
  root,
  'apps/mobile/src/story-preview-sources.generated.ts',
)

const assertUnique = (values: readonly string[], label: string): void => {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`)
  }
}

const sha256 = (bytes: Buffer): string =>
  `sha256:${createHash('sha256').update(bytes).digest('hex')}`

const currentSourceIdByStoryId = new Map(
  storyPreviewDefinitions.map(
    definition => [definition.storyId, definition.source.sourceId] as const,
  ),
)

const downloadAndNormalize = async (
  replacement: Replacement,
): Promise<{ checksum: string; relativePath: string }> => {
  const fileName = `${replacement.storyId}.2026-08-24.jpg`
  const targetPath = resolve(previewDirectory, fileName)
  const relativePath = `story-previews/${fileName}`

  if (
    currentSourceIdByStoryId.get(replacement.storyId) ===
      replacement.sourceId &&
    replacement.cropPosition === undefined
  ) {
    try {
      const existing = await readFile(targetPath)
      const metadata = await sharp(existing).metadata()
      if (metadata.width === 1024 && metadata.height === 1024) {
        return { checksum: sha256(existing), relativePath }
      }
    } catch {
      // A missing or incomplete file is downloaded below.
    }
  }

  const imageUrl = `https://images.pexels.com/photos/${replacement.sourceId}/pexels-photo-${replacement.sourceId}.jpeg?auto=compress&cs=tinysrgb&w=2400`
  const response = await fetch(imageUrl, {
    headers: { 'user-agent': 'CharTalk asset provenance refresh/2026-08-24' },
  })
  if (!response.ok) {
    throw new Error(
      `Pexels image ${replacement.sourceId} returned ${response.status}`,
    )
  }
  const sourceBytes = Buffer.from(await response.arrayBuffer())
  if (sourceBytes.length < 10_000) {
    throw new Error(
      `Pexels image ${replacement.sourceId} is unexpectedly small`,
    )
  }

  const normalized = await sharp(sourceBytes)
    .rotate()
    .resize(1024, 1024, {
      fit: 'cover',
      position: replacement.cropPosition ?? sharp.strategy.attention,
    })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer()
  await writeFile(targetPath, normalized)
  return { checksum: sha256(normalized), relativePath }
}

const serializeDefinitions = (
  definitions: readonly StoryPreviewDefinition[],
): string => `import type { ContentAsset } from '@chartalk/content-schema'

export type StoryPreviewCategory =
  | 'woman'
  | 'man'
  | 'building'
  | 'vehicle'
  | 'object'
  | 'nature'
  | 'scene'
  | 'landscape'
  | 'interior'

export interface StoryPreviewDefinition {
  storyId: string
  category: StoryPreviewCategory
  asset: ContentAsset
  source: {
    provider: 'Pexels' | 'Unsplash'
    sourceId: string
    pageUrl: string
    author?: string
  }
}

export const STORY_PREVIEW_LICENSES = {
  Pexels: 'https://www.pexels.com/license/',
  Unsplash: 'https://unsplash.com/license',
} as const

export const STORY_PREVIEW_TRANSFORMATION =
  'Square attention crop, resize to 1024×1024, JPEG quality 82, embedded metadata stripped.'

export const STORY_PREVIEW_REVIEW =
  'All 243 covers reviewed against their title and premise on 2026-08-24; 100 mismatches and weak fits replaced.'

export const STORY_PREVIEW_SEMANTIC_REPLACEMENTS = ${JSON.stringify(
  replacements.map(replacement => replacement.storyId),
  null,
  2,
)} as const

export const storyPreviewDefinitions: readonly StoryPreviewDefinition[] = ${JSON.stringify(
  definitions,
  null,
  2,
)}

const previewsByStoryId = new Map(
  storyPreviewDefinitions.map(
    definition => [definition.storyId, definition] as const,
  ),
)

export const storyPreviewDefinitionFor = (
  storyId: string,
): StoryPreviewDefinition | undefined => previewsByStoryId.get(storyId)

export const storyPreviewAssetIdFor = (storyId: string): string | undefined =>
  storyPreviewDefinitionFor(storyId)?.asset.assetId

export const storyPreviewAssetsFor = (
  storyIds: readonly string[],
): readonly ContentAsset[] =>
  storyIds.flatMap(storyId => {
    const definition = storyPreviewDefinitionFor(storyId)
    return definition ? [definition.asset] : []
  })
`

const serializeStaticSources = async (): Promise<string> => {
  const files = (await readdir(previewDirectory))
    .filter(fileName => fileName.endsWith('.jpg'))
    .sort((left, right) => left.localeCompare(right))

  const entries = files.map(fileName => {
    const assetId = `cover.${basename(fileName, '.jpg')}`
    return `  '${assetId}':\n    require('../assets/story-previews/${fileName}') as number,`
  })

  return `/* eslint-disable @typescript-eslint/no-require-imports -- Metro requires static asset references. */

export const storyPreviewSources: Record<string, number> = {
${entries.join('\n')}
}
`
}

const main = async (): Promise<void> => {
  if (replacements.length !== 100) {
    throw new Error(
      `Expected 100 semantic replacements, got ${replacements.length}`,
    )
  }
  assertUnique(
    replacements.map(replacement => replacement.storyId),
    'Replacement story IDs',
  )
  assertUnique(
    replacements.map(replacement => replacement.sourceId),
    'Replacement Pexels IDs',
  )

  const currentStoryIds = new Set(
    storyPreviewDefinitions.map(definition => definition.storyId),
  )
  for (const replacement of replacements) {
    if (!currentStoryIds.has(replacement.storyId)) {
      throw new Error(`Unknown preview story ${replacement.storyId}`)
    }
  }

  await mkdir(previewDirectory, { recursive: true })
  const completed = new Map<
    string,
    { checksum: string; relativePath: string }
  >()
  let cursor = 0
  const workers = Array.from({ length: 6 }, async () => {
    while (cursor < replacements.length) {
      const replacement = replacements[cursor]
      cursor += 1
      if (!replacement) continue
      completed.set(
        replacement.storyId,
        await downloadAndNormalize(replacement),
      )
      console.log(
        `${completed.size}/${replacements.length} ${replacement.storyId} ← Pexels ${replacement.sourceId}`,
      )
    }
  })
  await Promise.all(workers)

  const replacementByStoryId = new Map(
    replacements.map(
      replacement => [replacement.storyId, replacement] as const,
    ),
  )
  const updated = storyPreviewDefinitions.map(definition => {
    const replacement = replacementByStoryId.get(definition.storyId)
    if (!replacement) return definition
    const output = completed.get(definition.storyId)
    if (!output) throw new Error(`Missing output for ${definition.storyId}`)
    return {
      storyId: definition.storyId,
      category: replacement.category,
      asset: {
        assetId: `cover.${definition.storyId}.2026-08-24`,
        kind: 'cover' as const,
        path: output.relativePath,
        checksum: output.checksum,
        width: 1024,
        height: 1024,
        altText: replacement.altText,
        provenance: 'licensed' as const,
      },
      source: {
        provider: 'Pexels' as const,
        sourceId: replacement.sourceId,
        pageUrl: `https://www.pexels.com/photo/${replacement.pageSlug}/`,
      },
    }
  })

  assertUnique(
    updated.map(definition => definition.asset.checksum),
    'Normalized preview checksums',
  )
  assertUnique(
    updated.map(
      definition =>
        `${definition.source.provider}:${definition.source.sourceId}`,
    ),
    'Preview source IDs',
  )

  await writeFile(definitionsPath, serializeDefinitions(updated))
  await writeFile(sourcesPath, await serializeStaticSources())
  console.log('Updated story preview metadata and Metro source map.')
}

await main()
