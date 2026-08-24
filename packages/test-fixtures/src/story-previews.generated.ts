import type { ContentAsset } from '@razvilka/content-schema'

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

export const STORY_PREVIEW_SEMANTIC_REPLACEMENTS = [
  'story.ira.after-deadline',
  'story.dina.three-knocks',
  'story.bulk.0001',
  'story.bulk.0005',
  'story.bulk.0032',
  'story.bulk.0047',
  'story.bulk.0092',
  'story.bulk.0093',
  'story.bulk.0095',
  'story.bulk.0109',
  'story.bulk.0121',
  'story.bulk.0137',
  'story.bulk.0157',
  'story.bulk.0165',
  'story.bulk.0168',
  'story.bulk.0207',
  'story.bulk.0217',
  'story.bulk.0225',
  'story.bulk.0227',
  'story.bulk.0238',
  'story.bulk.0239',
  'story.asya.seven-minutes',
  'story.bulk.0057',
  'story.bulk.0059',
  'story.bulk.0069',
  'story.bulk.0119',
  'story.bulk.0149',
  'story.bulk.0169',
  'story.bulk.0181',
  'story.bulk.0185',
  'story.bulk.0187',
  'story.bulk.0201',
  'story.bulk.0211',
  'story.bulk.0219',
  'story.bulk.0007',
  'story.bulk.0009',
  'story.bulk.0061',
  'story.bulk.0131',
  'story.bulk.0013',
  'story.bulk.0027',
  'story.bulk.0029',
  'story.bulk.0045',
  'story.bulk.0051',
  'story.bulk.0067',
  'story.bulk.0076',
  'story.bulk.0091',
  'story.bulk.0129',
  'story.bulk.0141',
  'story.bulk.0213',
  'story.bulk.0231',
  'story.bulk.0019',
  'story.bulk.0025',
  'story.bulk.0035',
  'story.bulk.0073',
  'story.bulk.0089',
  'story.bulk.0096',
  'story.bulk.0147',
  'story.bulk.0153',
  'story.bulk.0159',
  'story.bulk.0182',
  'story.bulk.0197',
  'story.bulk.0233',
  'story.bulk.0003',
  'story.bulk.0008',
  'story.bulk.0018',
  'story.bulk.0023',
  'story.bulk.0039',
  'story.bulk.0043',
  'story.bulk.0077',
  'story.bulk.0103',
  'story.bulk.0167',
  'story.bulk.0189',
  'story.bulk.0011',
  'story.bulk.0021',
  'story.bulk.0053',
  'story.bulk.0075',
  'story.bulk.0083',
  'story.bulk.0087',
  'story.bulk.0115',
  'story.bulk.0139',
  'story.bulk.0145',
  'story.bulk.0177',
  'story.bulk.0203',
  'story.bulk.0215',
  'story.bulk.0024',
  'story.bulk.0037',
  'story.bulk.0055',
  'story.bulk.0099',
  'story.bulk.0111',
  'story.bulk.0161',
  'story.bulk.0235',
  'story.bulk.0031',
  'story.bulk.0113',
  'story.bulk.0117',
  'story.bulk.0133',
  'story.bulk.0155',
  'story.bulk.0171',
  'story.bulk.0173',
  'story.bulk.0179',
  'story.bulk.0205',
] as const

export const storyPreviewDefinitions: readonly StoryPreviewDefinition[] = [
  {
    storyId: 'story.ira.after-deadline',
    category: 'woman',
    asset: {
      assetId: 'cover.story.ira.after-deadline.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.ira.after-deadline.2026-08-24.jpg',
      checksum:
        'sha256:1690eb4f72ab270bd93cb98b1ab452a7744071f46869b5704aacb7ffb9ff0288',
      width: 1024,
      height: 1024,
      altText:
        'Женщина при свете настольной лампы сравнивает документы в ночном офисе.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '9062771',
      pageUrl:
        'https://www.pexels.com/photo/woman-sitting-in-front-of-a-desk-reading-the-documents-9062771/',
    },
  },
  {
    storyId: 'story.asya.seven-minutes',
    category: 'woman',
    asset: {
      assetId: 'cover.story.asya.seven-minutes.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.asya.seven-minutes.2026-08-24.jpg',
      checksum:
        'sha256:cd16d6f5ded677893f1e154d92d44a7468949598c9a15da9b74e4e18d3d75670',
      width: 1024,
      height: 1024,
      altText: 'Женщина работает ночью за столом с телефонами и мониторами.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '30248067',
      pageUrl:
        'https://www.pexels.com/photo/busy-office-woman-on-phone-with-computers-30248067/',
    },
  },
  {
    storyId: 'story.dina.three-knocks',
    category: 'woman',
    asset: {
      assetId: 'cover.story.dina.three-knocks.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.dina.three-knocks.2026-08-24.jpg',
      checksum:
        'sha256:24fa5301bfab937a343dbd5566ab7cf6427c229bd4ac81ff54a78e2eddb25c02',
      width: 1024,
      height: 1024,
      altText: 'Женщина проверяет звуковую запись за пультом с микрофоном.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '4409969',
      pageUrl:
        'https://www.pexels.com/photo/unrecognizable-sound-engineer-installing-software-on-desktop-computer-at-home-4409969/',
    },
  },
  {
    storyId: 'story.bulk.0001',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0001.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0001.2026-08-24.jpg',
      checksum:
        'sha256:1f01280e2298fdced8bdffc15086a5cb8cf1cde1dcbd873bdd925baf529ea24f',
      width: 1024,
      height: 1024,
      altText:
        'Женщина работает с документами среди ящиков старого архивного каталога.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6549632',
      pageUrl:
        'https://www.pexels.com/photo/a-woman-writing-on-a-notebook-6549632/',
    },
  },
  {
    storyId: 'story.bulk.0002',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0002.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0002.2026-08-23.jpg',
      checksum:
        'sha256:f42186aff63212daf35e83bd919167366767adc0d25850e8970647384560006b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '35288344',
      pageUrl:
        'https://www.pexels.com/photo/natural-light-portrait-of-smiling-woman-35288344/',
    },
  },
  {
    storyId: 'story.bulk.0003',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0003.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0003.2026-08-24.jpg',
      checksum:
        'sha256:c4b4dd391d476dce40e9bf6be9617d4ed5d10c0c246a7a97c02dc69b2602b8a3',
      width: 1024,
      height: 1024,
      altText: 'Женская рука отмечает нужное место на бумажной карте.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '7634232',
      pageUrl:
        'https://www.pexels.com/photo/a-woman-s-hand-over-a-map-7634232/',
    },
  },
  {
    storyId: 'story.bulk.0004',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0004.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0004.2026-08-23.jpg',
      checksum:
        'sha256:67efda9e54fb35f1ba4d848d012f8fcb12476ed81540da5bc52eee5a30636522',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '28729264',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-in-natural-light-portrait-28729264/',
    },
  },
  {
    storyId: 'story.bulk.0005',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0005.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0005.2026-08-24.jpg',
      checksum:
        'sha256:13df486d0aa50e04379aa1b346f0c43fb80efb958c9f81cb15b5ae23a6eea0fe',
      width: 1024,
      height: 1024,
      altText:
        'Женщина разбирает письма и газету рядом с настольным телефоном.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '9841340',
      pageUrl:
        'https://www.pexels.com/photo/rear-view-on-womans-hand-holding-letters-on-table-9841340/',
    },
  },
  {
    storyId: 'story.bulk.0006',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0006.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0006.2026-08-23.jpg',
      checksum:
        'sha256:88aa1c564652b1327f5557374587fbdf7da049f0593d8d496c06159152cabb16',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '24738150',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-redhead-woman-24738150/',
    },
  },
  {
    storyId: 'story.bulk.0007',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0007.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0007.2026-08-24.jpg',
      checksum:
        'sha256:e8bffe9e557d7e8a4b73b87aa0c03d966dcf6e3f38ac49dc0bc88fbe910683b2',
      width: 1024,
      height: 1024,
      altText: 'Женщина рассматривает плёночный негатив при красном свете.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '10276051',
      pageUrl:
        'https://www.pexels.com/photo/woman-with-negative-in-darkroom-10276051/',
    },
  },
  {
    storyId: 'story.bulk.0008',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0008.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0008.2026-08-24.jpg',
      checksum:
        'sha256:c71e1626f89b4a5414f1144d74f8644bb0fc802ad0acd5f03dc090a07069b57c',
      width: 1024,
      height: 1024,
      altText: 'Женщина держит старинный ключ в полутёмном помещении.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '2187517',
      pageUrl: 'https://www.pexels.com/photo/woman-holding-a-key-2187517/',
    },
  },
  {
    storyId: 'story.bulk.0009',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0009.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0009.2026-08-24.jpg',
      checksum:
        'sha256:ccafbbf301bb277f207d5669a8f7fe26a509e93e7cc832c2a05ccdcd41d05285',
      width: 1024,
      height: 1024,
      altText: 'Женщина печатает фотографии в тёмной фотолаборатории.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '10276049',
      pageUrl:
        'https://www.pexels.com/photo/woman-working-in-darkroom-10276049/',
    },
  },
  {
    storyId: 'story.bulk.0010',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0010.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0010.2026-08-23.jpg',
      checksum:
        'sha256:01e458e34aabfd20ff157aae8acafb19fc06019b8ec733f7a9be4b4f64a57584',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '33867534',
      pageUrl:
        'https://www.pexels.com/photo/lifestyle-portrait-of-blonde-woman-in-natural-light-33867534/',
    },
  },
  {
    storyId: 'story.bulk.0011',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0011.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0011.2026-08-24.jpg',
      checksum:
        'sha256:50d650b4dd37ba00360adba238cfed7675256867d6058c25cdd79559eb6af2c9',
      width: 1024,
      height: 1024,
      altText: 'Женщина смотрит из окна на дома напротив.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '8846941',
      pageUrl:
        'https://www.pexels.com/photo/back-view-of-woman-looking-out-the-window-in-a-high-rise-residential-block-8846941/',
    },
  },
  {
    storyId: 'story.bulk.0012',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0012.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0012.2026-08-23.jpg',
      checksum:
        'sha256:093f0c5d97a6c940d3c3032cc6d1be435600152744047326baa44ddf219d8885',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '26934181',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-blonde-woman-26934181/',
    },
  },
  {
    storyId: 'story.bulk.0013',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0013.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0013.2026-08-24.jpg',
      checksum:
        'sha256:c90bb5ae578a08db7e40fda9f6d269e0811b8bcd879541336391bb574472ba19',
      width: 1024,
      height: 1024,
      altText: 'Женщина открывает конверт над рабочим столом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '4792674',
      pageUrl:
        'https://www.pexels.com/photo/crop-unrecognizable-woman-opening-envelope-above-desk-with-twine-4792674/',
    },
  },
  {
    storyId: 'story.bulk.0014',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0014.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0014.2026-08-23.jpg',
      checksum:
        'sha256:2128b32335abc5f24c0c23a9024485b7f5c87d2f6885bfe73b1b7eae621bd299',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '31721843',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-smiling-woman-in-natural-light-31721843/',
    },
  },
  {
    storyId: 'story.bulk.0015',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0015.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0015.2026-08-23.jpg',
      checksum:
        'sha256:b6755fe0c076dc5282122daaa96d2ae042aad81d4cd851ede00d6ec006185b7e',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '57',
      pageUrl: 'https://unsplash.com/photos/SyBYM8R6VU4',
      author: 'Nicholas Swanson',
    },
  },
  {
    storyId: 'story.bulk.0016',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0016.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0016.2026-08-23.jpg',
      checksum:
        'sha256:e35f35e4094a1763e4a7c69b0b40c94c1b486e28d8773ae657e0582f32637e45',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '16216148',
      pageUrl: 'https://www.pexels.com/photo/smiling-redhead-woman-16216148/',
    },
  },
  {
    storyId: 'story.bulk.0017',
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0017.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0017.2026-08-23.jpg',
      checksum:
        'sha256:48b5144151afbc0b92da87df18e0f1e76e316b55978ba9c97514a1f89d535ddc',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '35406027',
      pageUrl:
        'https://www.pexels.com/photo/urban-scene-man-walking-in-city-street-35406027/',
    },
  },
  {
    storyId: 'story.bulk.0018',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0018.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0018.2026-08-24.jpg',
      checksum:
        'sha256:00c513d1220819dc2cd1feacdb3f9e7a83166fbf479a86a224783e359ff1ac1b',
      width: 1024,
      height: 1024,
      altText: 'Две женщины внимательно сверяют маршрут по бумажной карте.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '5622149',
      pageUrl: 'https://www.pexels.com/photo/women-reading-map-5622149/',
    },
  },
  {
    storyId: 'story.bulk.0019',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0019.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0019.2026-08-24.jpg',
      checksum:
        'sha256:2b5df24ecf01aa2304c7343686e8dc454e3c4c4c4546518c61b6aa72908b6f6f',
      width: 1024,
      height: 1024,
      altText: 'Женщина ждёт на тускло освещённой платформе метро.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '7460441',
      pageUrl:
        'https://www.pexels.com/photo/woman-waiting-in-a-subway-station-7460441/',
    },
  },
  {
    storyId: 'story.bulk.0020',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0020.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0020.2026-08-23.jpg',
      checksum:
        'sha256:3fadacefd581aeb3b601f2108d898fc16c1312f1e700d1bf555a02b1caef28c5',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '18782989',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-blonde-woman-18782989/',
    },
  },
  {
    storyId: 'story.bulk.0021',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0021.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0021.2026-08-24.jpg',
      checksum:
        'sha256:da0c43b7606d7cb923f6285451c8cbf777f04a4e72e36f4441bc2f9d9089254f',
      width: 1024,
      height: 1024,
      altText:
        'На кирпичной стене висит выцветшая рваная афиша с женским лицом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '12891801',
      pageUrl:
        'https://www.pexels.com/photo/torn-poster-on-brick-wall-12891801/',
    },
  },
  {
    storyId: 'story.bulk.0022',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0022.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0022.2026-08-23.jpg',
      checksum:
        'sha256:0dad60cc4c2ec82e8d5f0d21d98b388e33151738812ee8df7f21455c30872915',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '31568198',
      pageUrl:
        'https://www.pexels.com/photo/young-woman-in-glasses-smiling-indoors-31568198/',
    },
  },
  {
    storyId: 'story.bulk.0023',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0023.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0023.2026-08-24.jpg',
      checksum:
        'sha256:01147e5dd6ec8c272c02ef516dfc630484b843369d16277b260bccd1aa451f8e',
      width: 1024,
      height: 1024,
      altText: 'Женщина в наушниках слушает сообщение на телефоне.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '5965896',
      pageUrl:
        'https://www.pexels.com/photo/black-woman-in-earphones-listening-to-music-and-texting-message-5965896/',
    },
  },
  {
    storyId: 'story.bulk.0024',
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0024.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0024.2026-08-24.jpg',
      checksum:
        'sha256:99df4ea5ad68ce72c2a788b081f6bdf9628aeb494b98b34ac0e689cc87ce8044',
      width: 1024,
      height: 1024,
      altText: 'Цепочка следов проходит по снегу вдоль ночной улицы.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '37282196',
      pageUrl:
        'https://www.pexels.com/photo/snowy-night-street-scene-in-black-and-white-37282196/',
    },
  },
  {
    storyId: 'story.bulk.0025',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0025.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0025.2026-08-24.jpg',
      checksum:
        'sha256:dfa40426b13aaf3e36da9897f409b989b5936a5da274dfe2d494ad371c5dacad',
      width: 1024,
      height: 1024,
      altText: 'Женщина проверяет телефон на ночной автобусной остановке.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '37002894',
      pageUrl:
        'https://www.pexels.com/photo/woman-sitting-alone-in-a-bus-stop-at-night-37002894/',
    },
  },
  {
    storyId: 'story.bulk.0026',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0026.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0026.2026-08-23.jpg',
      checksum:
        'sha256:67a6f7bc1ca9da882861523ccf191267ee3c8e8a10a252cf59d97e3171b31d6a',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '32773007',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-smiling-woman-in-hijab-and-glasses-indoors-32773007/',
    },
  },
  {
    storyId: 'story.bulk.0027',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0027.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0027.2026-08-24.jpg',
      checksum:
        'sha256:762a5c697972775ae68f42ce3c40745ad6fecef481d96668741150ab71762939',
      width: 1024,
      height: 1024,
      altText: 'Женщина кладёт записку в конверт на деревянном столе.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '7319305',
      pageUrl:
        'https://www.pexels.com/photo/crop-unrecognizable-woman-placing-blank-paper-in-envelope-7319305/',
    },
  },
  {
    storyId: 'story.bulk.0028',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0028.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0028.2026-08-23.jpg',
      checksum:
        'sha256:d4a1f53a29438fcd4599b689e663a81acb13fb2c9fc9ce012fa92bc9bd8a7964',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29202658',
      pageUrl:
        'https://www.pexels.com/photo/happy-girl-with-glasses-smiling-indoors-29202658/',
    },
  },
  {
    storyId: 'story.bulk.0029',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0029.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0029.2026-08-24.jpg',
      checksum:
        'sha256:e7b3ea77e4a87cc8adeef662ba02e1a149942fc423ad24ccc3a11f3cc24cbea1',
      width: 1024,
      height: 1024,
      altText: 'Женщина держит длинную бумажную квитанцию.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '4959926',
      pageUrl:
        'https://www.pexels.com/photo/close-up-of-woman-hands-holding-bill-4959926/',
    },
  },
  {
    storyId: 'story.bulk.0030',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0030.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0030.2026-08-23.jpg',
      checksum:
        'sha256:55a06101d654627dd89c2b81928b9cb73beeaba41cdd7ff6e6c44834aff67f2f',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '36291666',
      pageUrl:
        'https://www.pexels.com/photo/smiling-senior-woman-with-glasses-indoors-36291666/',
    },
  },
  {
    storyId: 'story.bulk.0031',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0031.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0031.2026-08-24.jpg',
      checksum:
        'sha256:8fd8cf7bb9782518777c8a26941f60f40d4ed7b7e7a3bf924a3ea8c7900f9eb6',
      width: 1024,
      height: 1024,
      altText: 'Женщина открывает один из жёлтых шкафчиков.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '3902734',
      pageUrl:
        'https://www.pexels.com/photo/woman-in-black-tank-top-opening-locker-3902734/',
    },
  },
  {
    storyId: 'story.bulk.0032',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0032.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0032.2026-08-24.jpg',
      checksum:
        'sha256:282f9e219fe1ceba5418d11240a57c46b021e2420a58141e8bf1b67d0b48b236',
      width: 1024,
      height: 1024,
      altText: 'В пустом ночном вагоне в окне отражается женщина с камерой.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17537616',
      pageUrl:
        'https://www.pexels.com/photo/reflection-of-woman-taking-pictures-in-train-window-17537616/',
    },
  },
  {
    storyId: 'story.bulk.0033',
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0033.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0033.2026-08-23.jpg',
      checksum:
        'sha256:0573452ebe2fcc46fee590f1991637343fb6dc46a838811f1180e567a17bcf38',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '12345345',
      pageUrl: 'https://www.pexels.com/photo/a-man-walking-in-a-city-12345345/',
    },
  },
  {
    storyId: 'story.bulk.0034',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0034.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0034.2026-08-23.jpg',
      checksum:
        'sha256:cefc798259c1876d58aa9c2610ffae0d61413ba9bdbbec24e06d764ec53987b9',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '4223807',
      pageUrl:
        'https://www.pexels.com/photo/fashion-people-woman-coffee-4223807/',
    },
  },
  {
    storyId: 'story.bulk.0035',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0035.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0035.2026-08-24.jpg',
      checksum:
        'sha256:165df57765d457945630fd3d6fbe10d9156a8ec96f4241c1ee083a4f9892d785',
      width: 1024,
      height: 1024,
      altText: 'Женщина ждёт поезд на платформе под станционными часами.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17225406',
      pageUrl:
        'https://www.pexels.com/photo/woman-waiting-for-a-train-17225406/',
    },
  },
  {
    storyId: 'story.bulk.0036',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0036.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0036.2026-08-23.jpg',
      checksum:
        'sha256:26c2a20b789323f4fbc59d34e291bf1d23d4692f46badfc671d40fa55b1f151b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6248445',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-wearing-eyeglasses-6248445/',
    },
  },
  {
    storyId: 'story.bulk.0037',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0037.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0037.2026-08-24.jpg',
      checksum:
        'sha256:a1b34f7d4fcd59a6df6692c157cb37defdee3b66fdb01cdbae428b910f47b56d',
      width: 1024,
      height: 1024,
      altText: 'Женщина записывает голос у студийного микрофона.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6954190',
      pageUrl:
        'https://www.pexels.com/photo/content-woman-recording-voice-message-6954190/',
    },
  },
  {
    storyId: 'story.bulk.0038',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0038.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0038.2026-08-23.jpg',
      checksum:
        'sha256:f60b9910ec7b7e13e17f5a6df74ec8e8fb0cd19a71633be5751feab611466d3b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19039138',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-with-curly-hair-19039138/',
    },
  },
  {
    storyId: 'story.bulk.0039',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0039.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0039.2026-08-24.jpg',
      checksum:
        'sha256:79884f7a4dff617ce1fbcac30cc7607a25c39fbf18855afe2137cb98b2e14e7d',
      width: 1024,
      height: 1024,
      altText: 'Женщина рассматривает необычный старинный ключ.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '14182213',
      pageUrl: 'https://www.pexels.com/photo/woman-holding-a-key-14182213/',
    },
  },
  {
    storyId: 'story.bulk.0040',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0040.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0040.2026-08-23.jpg',
      checksum:
        'sha256:726a4a6ef332139ec053d4cb8cdf0dc081baab9ab37f8e3a37fccfa9494de4db',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '32119913',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-with-natural-curly-hair-32119913/',
    },
  },
  {
    storyId: 'story.bulk.0041',
    category: 'interior',
    asset: {
      assetId: 'cover.story.bulk.0041.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0041.2026-08-23.jpg',
      checksum:
        'sha256:f9bf1e96bcb4737d3994062786f59f7f2e4bea4b29dd202d17831c8dbaa7fc76',
      width: 1024,
      height: 1024,
      altText: 'Интерьер жилого или общественного пространства.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '208',
      pageUrl: 'https://unsplash.com/photos/NYxxuBSQzp4',
      author: 'Martin Wessely',
    },
  },
  {
    storyId: 'story.bulk.0042',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0042.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0042.2026-08-23.jpg',
      checksum:
        'sha256:6379bf0924998f4df6bf521dbd813a802480303fbc55155c1d71888c09d4cdf1',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6654226',
      pageUrl:
        'https://www.pexels.com/photo/a-woman-smiling-while-wearing-eyeglasses-6654226/',
    },
  },
  {
    storyId: 'story.bulk.0043',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0043.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0043.2026-08-24.jpg',
      checksum:
        'sha256:fc491a727e3571c5a50002ca5eaf949ef6bbdad95f97e74db13b15634f488d92',
      width: 1024,
      height: 1024,
      altText: 'Женщина указывает на отметку на развёрнутой карте.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '20233772',
      pageUrl: 'https://www.pexels.com/photo/woman-holding-a-map-20233772/',
    },
  },
  {
    storyId: 'story.bulk.0044',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0044.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0044.2026-08-23.jpg',
      checksum:
        'sha256:5ec5c8becbbb5770d16e56352c0c49e9f8a049f41e7ed8c6209da0e1fe2c5a7e',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '7626623',
      pageUrl:
        'https://www.pexels.com/photo/smiling-asian-woman-looking-at-camera-7626623/',
    },
  },
  {
    storyId: 'story.bulk.0045',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0045.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0045.2026-08-24.jpg',
      checksum:
        'sha256:2f060e30c43bc28bf06bb16145e03b7d6a9ad72f236f49fb9911aeb97b54faf8',
      width: 1024,
      height: 1024,
      altText: 'Женщина изучает ящики старого библиотечного каталога.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19872945',
      pageUrl:
        'https://www.pexels.com/photo/a-card-catalogue-in-a-library-19872945/',
    },
  },
  {
    storyId: 'story.bulk.0046',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0046.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0046.2026-08-23.jpg',
      checksum:
        'sha256:9166dffb1176490ecf528dd15b05f6aab46751403615c63f7518cc8e2b2071d7',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19836044',
      pageUrl:
        'https://www.pexels.com/photo/a-smiling-black-woman-in-a-black-top-19836044/',
    },
  },
  {
    storyId: 'story.bulk.0047',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0047.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0047.2026-08-24.jpg',
      checksum:
        'sha256:cd9db545501aa953147d474db295159554c47ea56e49f0a1fb510a62621f1933',
      width: 1024,
      height: 1024,
      altText: 'Женщина едет в ночном автобусе, освещённом зелёными огнями.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '35600864',
      pageUrl:
        'https://www.pexels.com/photo/woman-on-night-bus-with-green-interior-35600864/',
    },
  },
  {
    storyId: 'story.bulk.0048',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0048.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0048.2026-08-23.jpg',
      checksum:
        'sha256:a33aebf2040f65b745f7e85d7914c0aacf948613ae4da0e300ac6b5445de524c',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '8154990',
      pageUrl:
        'https://www.pexels.com/photo/close-up-shot-of-a-woman-in-hijab-8154990/',
    },
  },
  {
    storyId: 'story.bulk.0049',
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0049.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0049.2026-08-23.jpg',
      checksum:
        'sha256:bb40197e5bfde8407ef41dc2cb4722e9b4876842be75abd709a0ff2756ac98dc',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '28346390',
      pageUrl:
        'https://www.pexels.com/photo/a-man-walking-down-a-street-in-a-city-28346390/',
    },
  },
  {
    storyId: 'story.bulk.0050',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0050.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0050.2026-08-23.jpg',
      checksum:
        'sha256:3bf5c5583ee7a7a82d6104a53c48ef1cccaed0cff200e2a37f45fb9fca96d0e5',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29724177',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-two-smiling-black-women-indoors-29724177/',
    },
  },
  {
    storyId: 'story.bulk.0051',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0051.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0051.2026-08-24.jpg',
      checksum:
        'sha256:241547a7cc607cfc151d1e7ed58917d392a6f7e7ea94a7ed92c3aa772c1fa9b0',
      width: 1024,
      height: 1024,
      altText: 'Женщина внимательно читает документы из папки.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '8297154',
      pageUrl:
        'https://www.pexels.com/photo/a-woman-examining-a-folder-of-documents-8297154/',
    },
  },
  {
    storyId: 'story.bulk.0052',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0052.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0052.2026-08-23.jpg',
      checksum:
        'sha256:96f7340ef3ddf2a2e0783c8f57b4f711dace0504ad1f8c08fd69385a128b67d3',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '15650972',
      pageUrl:
        'https://www.pexels.com/photo/photo-of-a-young-woman-standing-outside-and-smiling-15650972/',
    },
  },
  {
    storyId: 'story.bulk.0053',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0053.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0053.2026-08-24.jpg',
      checksum:
        'sha256:1aeedd7ec286f0026ccddd2f23ed2626d26f2a5e2b05c675d4e168c3083a54cc',
      width: 1024,
      height: 1024,
      altText: 'Женщина задумчиво смотрит в окно городской квартиры.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '9736943',
      pageUrl:
        'https://www.pexels.com/photo/a-woman-looking-through-the-window-9736943/',
    },
  },
  {
    storyId: 'story.bulk.0054',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0054.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0054.2026-08-23.jpg',
      checksum:
        'sha256:d335b6975e968ce6d7ca1973519ee25668991f7ec17715e0026247b913e6d162',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19560393',
      pageUrl:
        'https://www.pexels.com/photo/young-woman-standing-in-the-window-19560393/',
    },
  },
  {
    storyId: 'story.bulk.0055',
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0055.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0055.2026-08-24.jpg',
      checksum:
        'sha256:6c4d3f74f1e1df1b7213193be6b163643db31815667af6d637fc387454f9e166',
      width: 1024,
      height: 1024,
      altText: 'Следы тянутся по снегу через освещённый ночной мост.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '5058972',
      pageUrl:
        'https://www.pexels.com/photo/view-of-a-bridge-and-footprints-in-the-snow-at-night-5058972/',
    },
  },
  {
    storyId: 'story.bulk.0056',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0056.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0056.2026-08-23.jpg',
      checksum:
        'sha256:ffbb6f6c6badf89130decfc933d3212f962d33a98077d304376b13e846d89df3',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '14865004',
      pageUrl:
        'https://www.pexels.com/photo/photo-of-a-smiling-woman-14865004/',
    },
  },
  {
    storyId: 'story.bulk.0057',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0057.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0057.2026-08-24.jpg',
      checksum:
        'sha256:f5913ed7ef7d3af9a227e0d19add6f304d99be09bf163e842524ac2ea72c9e37',
      width: 1024,
      height: 1024,
      altText: 'Женщина держит перед собой старый плёночный фотоаппарат.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11941525',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-holding-vintage-camera-in-front-of-her-face-11941525/',
    },
  },
  {
    storyId: 'story.bulk.0058',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0058.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0058.2026-08-23.jpg',
      checksum:
        'sha256:493c9f487a220056ba98db494a540f1b9bf2b289a16a0f31cfee1a9813326c27',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '26529937',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-smiling-woman-26529937/',
    },
  },
  {
    storyId: 'story.bulk.0059',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0059.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0059.2026-08-24.jpg',
      checksum:
        'sha256:b9fd0f7157a522ffb93f3b60cebfef4a3dda6e798ecd36657defac4a03a664ee',
      width: 1024,
      height: 1024,
      altText: 'Женщина держит старый фотоаппарат в комнате для встречи.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '36765709',
      pageUrl:
        'https://www.pexels.com/photo/woman-holding-vintage-camera-in-indoor-setting-36765709/',
    },
  },
  {
    storyId: 'story.bulk.0060',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0060.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0060.2026-08-23.jpg',
      checksum:
        'sha256:863119272cad9f12ef6ba719a332380e44e14a96e28845c9a1ed9993dd0aa210',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '20152922',
      pageUrl: 'https://www.pexels.com/photo/smiling-woman-in-forest-20152922/',
    },
  },
  {
    storyId: 'story.bulk.0061',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0061.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0061.2026-08-24.jpg',
      checksum:
        'sha256:4a19db63a4b7daa625d0ccb1ab99b2de942dfdff0abd325befc49cce2b1824aa',
      width: 1024,
      height: 1024,
      altText: 'Женщина снимает на старый плёночный фотоаппарат.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '9154461',
      pageUrl:
        'https://www.pexels.com/photo/grayscale-photo-of-a-woman-using-a-film-camera-9154461/',
    },
  },
  {
    storyId: 'story.bulk.0062',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0062.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0062.2026-08-23.jpg',
      checksum:
        'sha256:76bafe680e35eea6fbf22b5eec70555f8fbef80518a1f1d1154007adf768c47d',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '15590507',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-smiling-woman-on-black-background-15590507/',
    },
  },
  {
    storyId: 'story.bulk.0063',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0063.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0063.2026-08-23.jpg',
      checksum:
        'sha256:b217af0025fff70982b3c87e42026b6720b320ca05913e0de0a0281ec9807aa2',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '78',
      pageUrl: 'https://unsplash.com/photos/CtkDsu4w-Rs',
      author: 'Paul Evans',
    },
  },
  {
    storyId: 'story.bulk.0064',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0064.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0064.2026-08-23.jpg',
      checksum:
        'sha256:c464572422e7df42a24dfefbafee42a97fc321e47bfb56bca82225fda04340b0',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '13205272',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-woman-smiling-13205272/',
    },
  },
  {
    storyId: 'story.bulk.0065',
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0065.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0065.2026-08-23.jpg',
      checksum:
        'sha256:6d1553dc148c013b692cbc497fae60732fe583596cc2220bf6e42785e2f474f0',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '37181680',
      pageUrl:
        'https://www.pexels.com/photo/man-walking-in-urban-cityscape-with-modern-buildings-37181680/',
    },
  },
  {
    storyId: 'story.bulk.0066',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0066.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0066.2026-08-23.jpg',
      checksum:
        'sha256:f9088a9cd77bd89c7708dd980f41f9aae64c49666d556bdac15a853f573f265b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '20552804',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-woman-smiling-20552804/',
    },
  },
  {
    storyId: 'story.bulk.0067',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0067.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0067.2026-08-24.jpg',
      checksum:
        'sha256:eb9bae66a73fc14754f422387b97b937628db9701c46b26807c48e3bf3b46f98',
      width: 1024,
      height: 1024,
      altText: 'Женщина держит и читает рукописное письмо.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '10751389',
      pageUrl:
        'https://www.pexels.com/photo/person-in-white-shirt-holding-and-reading-a-letter-10751389/',
    },
  },
  {
    storyId: 'story.bulk.0068',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0068.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0068.2026-08-23.jpg',
      checksum:
        'sha256:8d08cb52e8a9870dc5625cd5c6bdf052ee9b197319999074c400a9bc164b34f0',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '32403506',
      pageUrl:
        'https://www.pexels.com/photo/candid-portrait-of-smiling-woman-in-cafe-32403506/',
    },
  },
  {
    storyId: 'story.bulk.0069',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0069.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0069.2026-08-24.jpg',
      checksum:
        'sha256:9ddedf462de298edc2ddeb46a3a67e79a6471a2b4ed71af97faf6750bd2e7c86',
      width: 1024,
      height: 1024,
      altText:
        'Женщина рассматривает плёночный фотоаппарат в полутёмной комнате.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '35552438',
      pageUrl:
        'https://www.pexels.com/photo/vintage-film-camera-portrait-of-woman-35552438/',
    },
  },
  {
    storyId: 'story.bulk.0070',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0070.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0070.2026-08-23.jpg',
      checksum:
        'sha256:a937de20cfb91fcd5b0ec8d36559192f9134c1b7e3d32cb15b5560cf3d2c1489',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '32403507',
      pageUrl:
        'https://www.pexels.com/photo/candid-portrait-of-a-woman-in-a-cafe-setting-32403507/',
    },
  },
  {
    storyId: 'story.bulk.0071',
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0071.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0071.2026-08-23.jpg',
      checksum:
        'sha256:45aeecd559feaac6535070e95c819268013f5410661240d1a428bee2e6efb4fc',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '146',
      pageUrl: 'https://unsplash.com/photos/GG0jOrmwqtw',
      author: 'Florian Klauer',
    },
  },
  {
    storyId: 'story.bulk.0072',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0072.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0072.2026-08-23.jpg',
      checksum:
        'sha256:7c69eff045a24ad9edd3deffb68124c4f651d10cac9730ba0148b78afbf347ac',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11611978',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-on-a-city-street-11611978/',
    },
  },
  {
    storyId: 'story.bulk.0073',
    category: 'interior',
    asset: {
      assetId: 'cover.story.bulk.0073.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0073.2026-08-24.jpg',
      checksum:
        'sha256:eaf74cdc31a56082f0b9e40945bcb7f8d6a08b8018ab2437169dff01667dd9b4',
      width: 1024,
      height: 1024,
      altText: 'Пустой вагон поезда освещён ночью.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '7398382',
      pageUrl: 'https://www.pexels.com/photo/empty-train-during-night-7398382/',
    },
  },
  {
    storyId: 'story.bulk.0074',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0074.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0074.2026-08-23.jpg',
      checksum:
        'sha256:8b3bb8ae8cac1506a891c490b5066dec2ff8755f92cf6ed9720b4c04acc3b643',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11625326',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-young-woman-smiling-on-a-city-street-11625326/',
    },
  },
  {
    storyId: 'story.bulk.0075',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0075.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0075.2026-08-24.jpg',
      checksum:
        'sha256:f4a31320d94ade1b687fab7f20179941f3fec162b9dc1d79b72a964e11dcb833',
      width: 1024,
      height: 1024,
      altText: 'Женщина выглядывает из окна старого городского дома.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '15920210',
      pageUrl:
        'https://www.pexels.com/photo/woman-in-apartment-windows-15920210/',
    },
  },
  {
    storyId: 'story.bulk.0076',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0076.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0076.2026-08-24.jpg',
      checksum:
        'sha256:c2f8427d583f66c997e1ac9ddf5f9ebe82d7e78dc1568f80b38750a1d24ee501',
      width: 1024,
      height: 1024,
      altText: 'Женщина идёт между рядами старых архивных каталогов.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '30143689',
      pageUrl:
        'https://www.pexels.com/photo/woman-walking-in-vintage-library-card-catalog-room-30143689/',
    },
  },
  {
    storyId: 'story.bulk.0077',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0077.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0077.2026-08-24.jpg',
      checksum:
        'sha256:b419e29873161695f209c63a7d61ca0c7392ddb9af160844f0e2e94a1d75024c',
      width: 1024,
      height: 1024,
      altText: 'Женщина показывает связку ключей в квартире.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '7579200',
      pageUrl: 'https://www.pexels.com/photo/woman-holding-a-key-7579200/',
    },
  },
  {
    storyId: 'story.bulk.0078',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0078.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0078.2026-08-23.jpg',
      checksum:
        'sha256:2d72b49f1fc90435491111323b08e7c0d1b21b7fce53e3ece539ea302c650807',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '36030315',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-smiling-woman-in-urban-setting-36030315/',
    },
  },
  {
    storyId: 'story.bulk.0079',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0079.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0079.2026-08-23.jpg',
      checksum:
        'sha256:fc15ba72b68504f67d6e1609af1160e8b98b84143d0c5dc46735556fede12556',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '84',
      pageUrl: 'https://unsplash.com/photos/63qfL0TciY8',
      author: 'Johnny Lam',
    },
  },
  {
    storyId: 'story.bulk.0080',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0080.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0080.2026-08-23.jpg',
      checksum:
        'sha256:0ad8e147e9d9e90e8d9f318f19220e3873a3df69848a7a2b73d4be5417c4ed90',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11201762',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-on-city-street-11201762/',
    },
  },
  {
    storyId: 'story.bulk.0081',
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0081.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0081.2026-08-23.jpg',
      checksum:
        'sha256:543abc23ef14370242c3c69b400bf7649cd81032e1522d7e7fd8819bfca8d625',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '1241173',
      pageUrl:
        'https://www.pexels.com/photo/man-sitting-beside-table-near-clear-glass-window-1241173/',
    },
  },
  {
    storyId: 'story.bulk.0082',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0082.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0082.2026-08-23.jpg',
      checksum:
        'sha256:997def92d649105b64868cfb3e10892dfd676fb8058085012d74fb3a104056ef',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '14269450',
      pageUrl:
        'https://www.pexels.com/photo/a-woman-smiling-in-a-city-14269450/',
    },
  },
  {
    storyId: 'story.bulk.0083',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0083.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0083.2026-08-24.jpg',
      checksum:
        'sha256:f76d5943ca76684aa50e8b790d85186f62219d6199b851f20370d983dd392fc7',
      width: 1024,
      height: 1024,
      altText: 'На городской стене слоями отходит старая афиша.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11027038',
      pageUrl:
        'https://www.pexels.com/photo/close-up-shot-of-a-vandalized-wall-11027038/',
    },
  },
  {
    storyId: 'story.bulk.0084',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0084.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0084.2026-08-23.jpg',
      checksum:
        'sha256:d76d13185bd69522c5bba20f5fe492a510f0bb5ac1fd86ef4a6437e88791b652',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17391366',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-on-city-street-17391366/',
    },
  },
  {
    storyId: 'story.bulk.0085',
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0085.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0085.2026-08-23.jpg',
      checksum:
        'sha256:2527dfe560fc86b9dba1bc03007ccbcf0f2d7b99bd456f00ca275ad720fc32b3',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '91',
      pageUrl: 'https://unsplash.com/photos/baRYCsjO6z4',
      author: 'Jennifer Trovato',
    },
  },
  {
    storyId: 'story.bulk.0086',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0086.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0086.2026-08-23.jpg',
      checksum:
        'sha256:f2a6e8c96df0f07acebe7faf9b8f4593b85b68a54e37bb126794528079cfff1b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '30667502',
      pageUrl:
        'https://www.pexels.com/photo/artistic-portrait-of-woman-in-natural-light-indoors-30667502/',
    },
  },
  {
    storyId: 'story.bulk.0087',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0087.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0087.2026-08-24.jpg',
      checksum:
        'sha256:40836f7fa0afab0f510d9e8980d46ddc7972b401803feb489ccc65ebe8951e58',
      width: 1024,
      height: 1024,
      altText: 'На стене старого кинотеатра облупились бумажные афиши.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11027039',
      pageUrl:
        'https://www.pexels.com/photo/peeled-posters-on-concrete-wall-11027039/',
    },
  },
  {
    storyId: 'story.bulk.0088',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0088.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0088.2026-08-23.jpg',
      checksum:
        'sha256:67678828046d44e7057865798b3cc15114f552c69721e5a8a1fe12a183df1a8e',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '28757139',
      pageUrl:
        'https://www.pexels.com/photo/artistic-portrait-of-a-woman-in-warm-light-28757139/',
    },
  },
  {
    storyId: 'story.bulk.0089',
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0089.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0089.2026-08-24.jpg',
      checksum:
        'sha256:444c56b797643d8c21fcd36ad806d1ff078663dadb8241d0904aec5bfd61932e',
      width: 1024,
      height: 1024,
      altText: 'Мужчина проверяет телефон на мокрой ночной остановке.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '28443579',
      pageUrl:
        'https://www.pexels.com/photo/man-waiting-at-night-bus-stop-with-rain-28443579/',
    },
  },
  {
    storyId: 'story.bulk.0090',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0090.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0090.2026-08-23.jpg',
      checksum:
        'sha256:8bb04b449d3abe568eacc2cd0b5c6ec1ccf2dc51dc451879d039eacf8e1358a3',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '36478516',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-woman-in-natural-light-36478516/',
    },
  },
  {
    storyId: 'story.bulk.0091',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0091.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0091.2026-08-24.jpg',
      checksum:
        'sha256:e80c7a9efed1fa9c1360b0b9fd75d4ff90b9876480eefde8f9df8c8630f75e0e',
      width: 1024,
      height: 1024,
      altText: 'Руки сортируют несколько бумажных квитанций на столе.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '7545333',
      pageUrl: 'https://www.pexels.com/photo/person-holding-a-receipt-7545333/',
    },
  },
  {
    storyId: 'story.bulk.0092',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0092.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0092.2026-08-24.jpg',
      checksum:
        'sha256:c1daab82a4c8064dfdee5c024408a84da949ecf61b30897f81b1de73c9d898b0',
      width: 1024,
      height: 1024,
      altText:
        'Женщина рассматривает коллекцию старых фотоаппаратов на полках.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '28892122',
      pageUrl:
        'https://www.pexels.com/photo/woman-admiring-vintage-camera-collection-indoors-28892122/',
    },
  },
  {
    storyId: 'story.bulk.0093',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0093.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0093.2026-08-24.jpg',
      checksum:
        'sha256:13033f91192e879c34d63f66d1b8ccb1f62e1a347e474d7c40a2b74c58de11a5',
      width: 1024,
      height: 1024,
      altText: 'Женщина проверяет открытый пустой шкафчик.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '8007597',
      pageUrl: 'https://www.pexels.com/photo/woman-opening-her-locker-8007597/',
    },
  },
  {
    storyId: 'story.bulk.0094',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0094.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0094.2026-08-23.jpg',
      checksum:
        'sha256:1b88ab3234cc262e855f6329615140d800ba061453299c39df480602fb7d23b9',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '18770991',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-in-a-music-studio-18770991/',
    },
  },
  {
    storyId: 'story.bulk.0095',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0095.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0095.2026-08-24.jpg',
      checksum:
        'sha256:a237be98afbcdfb9522b878dd858dfb5de141a1f4b5b369a8da1afc47dd004d5',
      width: 1024,
      height: 1024,
      altText: 'Женщина ищет карточку в ящике библиотечного архива.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6549375',
      pageUrl:
        'https://www.pexels.com/photo/student-looking-at-an-archive-drawer-6549375/',
    },
  },
  {
    storyId: 'story.bulk.0096',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0096.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0096.2026-08-24.jpg',
      checksum:
        'sha256:f4f617883928c648bda3002f7d3d1c7eb282b137f0de2d7ced0884186dd3606e',
      width: 1024,
      height: 1024,
      altText: 'Две женщины разговаривают в почти пустом вагоне.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '8658854',
      pageUrl:
        'https://www.pexels.com/photo/women-talking-on-empty-train-8658854/',
    },
  },
  {
    storyId: 'story.bulk.0097',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0097.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0097.2026-08-23.jpg',
      checksum:
        'sha256:fb505f633fb4494fbe55f5237ca220156069296f4bcd02b5a72631e9024dcb94',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '39',
      pageUrl: 'https://unsplash.com/photos/pFqrYbhIAXs',
      author: 'Luke Chesser',
    },
  },
  {
    storyId: 'story.bulk.0098',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0098.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0098.2026-08-23.jpg',
      checksum:
        'sha256:e76227b0feed39e3b298753d188bf877d81377a50f51e871cc62e81eb1562aee',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17761284',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-in-headphones-17761284/',
    },
  },
  {
    storyId: 'story.bulk.0099',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0099.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0099.2026-08-24.jpg',
      checksum:
        'sha256:5ec47829b97d7ce10af43b90e92f9b96c1ad482221d3f92405e9f96f519e582f',
      width: 1024,
      height: 1024,
      altText: 'Женщина в наушниках проверяет запись у студийного микрофона.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19568107',
      pageUrl:
        'https://www.pexels.com/photo/female-singer-recording-in-a-studio-19568107/',
    },
  },
  {
    storyId: 'story.bulk.0100',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0100.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0100.2026-08-23.jpg',
      checksum:
        'sha256:deb70f9947fe68539950918b2ee045cc403586907db9a7f94935e016973afd42',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6643922',
      pageUrl:
        'https://www.pexels.com/photo/a-studio-portrait-of-a-smiling-woman-6643922/',
    },
  },
  {
    storyId: 'story.bulk.0101',
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0101.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0101.2026-08-23.jpg',
      checksum:
        'sha256:e4f4719fe0c8f607979535576179f5e3b65c3ec62da97b3979bc8ae6726a29fc',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '181',
      pageUrl: 'https://unsplash.com/photos/0EjvnhOkPLM',
      author: 'Nick Turner',
    },
  },
  {
    storyId: 'story.bulk.0102',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0102.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0102.2026-08-23.jpg',
      checksum:
        'sha256:1fa99cf9491b46cf4c619f65c41ab96306d3144a53952d5d374da5f7cc5812cb',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '30390613',
      pageUrl:
        'https://www.pexels.com/photo/artistic-portrait-of-a-woman-in-warm-lighting-30390613/',
    },
  },
  {
    storyId: 'story.bulk.0103',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0103.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0103.2026-08-24.jpg',
      checksum:
        'sha256:4ac38f07df0b0eba92290c9d917f7a5b48fb7892ef27560099c25f04acc38894',
      width: 1024,
      height: 1024,
      altText: 'Женщина держит связку ключей перед собой.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '4971273',
      pageUrl:
        'https://www.pexels.com/photo/a-person-holding-a-bunch-of-keys-4971273/',
    },
  },
  {
    storyId: 'story.bulk.0104',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0104.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0104.2026-08-23.jpg',
      checksum:
        'sha256:f92d66a702d97ca1f20bdb2dee5fa7c89359fe0262f058a3a3ea1d746a56c490',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '33038048',
      pageUrl:
        'https://www.pexels.com/photo/young-woman-listening-to-music-with-headphones-33038048/',
    },
  },
  {
    storyId: 'story.bulk.0105',
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0105.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0105.2026-08-23.jpg',
      checksum:
        'sha256:07df1872764cd4615baefef7a768cb962c4f188e53a7c3c5e65db8a966024a0d',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '54',
      pageUrl: 'https://unsplash.com/photos/d19by2PLaPc',
      author: 'Nicholas Swanson',
    },
  },
  {
    storyId: 'story.bulk.0106',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0106.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0106.2026-08-23.jpg',
      checksum:
        'sha256:119b37d7fa0a48a824e12bd920c68f036b274be6d8fb8588ad5fa575ca35f820',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '35718213',
      pageUrl:
        'https://www.pexels.com/photo/outdoor-portrait-of-smiling-woman-in-natural-setting-35718213/',
    },
  },
  {
    storyId: 'story.bulk.0107',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0107.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0107.2026-08-23.jpg',
      checksum:
        'sha256:9a870530753ca153c007b28fa679064ca6de7fc1fd48f7e6fab38c43178a4a0f',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '101',
      pageUrl: 'https://unsplash.com/photos/8lMhzUjD1Wk',
      author: 'Christian Bardenhorst',
    },
  },
  {
    storyId: 'story.bulk.0108',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0108.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0108.2026-08-23.jpg',
      checksum:
        'sha256:33210fa2992e75fd69681400a0bc8ee1a972749a0b5a949e7ef22caf4fae13d7',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29052911',
      pageUrl:
        'https://www.pexels.com/photo/smiling-young-woman-outdoors-in-summer-29052911/',
    },
  },
  {
    storyId: 'story.bulk.0109',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0109.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0109.2026-08-24.jpg',
      checksum:
        'sha256:815e72cca0d9d59ca56df54ce3a1f8042f96703c021e0aca9d284a0b019833e9',
      width: 1024,
      height: 1024,
      altText: 'Женщина ждёт автобус на освещённой ночной остановке.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '20267270',
      pageUrl:
        'https://www.pexels.com/photo/woman-waiting-at-a-bus-stop-at-night-20267270/',
    },
  },
  {
    storyId: 'story.bulk.0110',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0110.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0110.2026-08-23.jpg',
      checksum:
        'sha256:e89012bf1e9a4e10ac88d615a9d76329b8d30d9c4efd9fbf0cef44eefba24711',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '32023255',
      pageUrl:
        'https://www.pexels.com/photo/young-woman-smiling-outdoors-in-nature-32023255/',
    },
  },
  {
    storyId: 'story.bulk.0111',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0111.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0111.2026-08-24.jpg',
      checksum:
        'sha256:b6cea75772f6bbf71dcecb5248268d575ecd44d64811fde93d75f0073579d405',
      width: 1024,
      height: 1024,
      altText: 'Женщина просматривает незавершённую запись в студии.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '14540964',
      pageUrl: 'https://www.pexels.com/photo/woman-during-recording-14540964/',
    },
  },
  {
    storyId: 'story.bulk.0112',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0112.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0112.2026-08-23.jpg',
      checksum:
        'sha256:1c0045bfea9fe37ec044b9c900c706ed1c0624facc6b5828aea58ea4932fbbe1',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '36334333',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-outdoors-in-scenic-landscape-36334333/',
    },
  },
  {
    storyId: 'story.bulk.0113',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0113.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0113.2026-08-24.jpg',
      checksum:
        'sha256:feb2fffe92d55cc685b022d1791ab0cafa199dd0312f0cc65dd89518088d2eec',
      width: 1024,
      height: 1024,
      altText: 'Женщина сидит в тихом коридоре комнаты ожидания.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19064368',
      pageUrl:
        'https://www.pexels.com/photo/woman-sitting-on-a-stool-in-the-corridor-19064368/',
    },
  },
  {
    storyId: 'story.bulk.0114',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0114.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0114.2026-08-23.jpg',
      checksum:
        'sha256:51cc03b479778c61a4d7c61db5c8da3691f13011872879579df5754740573e42',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '33029128',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-woman-with-short-hair-in-low-light-33029128/',
    },
  },
  {
    storyId: 'story.bulk.0115',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0115.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0115.2026-08-24.jpg',
      checksum:
        'sha256:d6ed4dbb1996447302024cd6a7277ca24a7fee84db4b73bd500cf45d0d8a5cb2',
      width: 1024,
      height: 1024,
      altText: 'Женщина стоит у большого окна и смотрит на город напротив.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '14215450',
      pageUrl:
        'https://www.pexels.com/photo/woman-looking-through-window-in-apartment-14215450/',
    },
  },
  {
    storyId: 'story.bulk.0116',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0116.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0116.2026-08-23.jpg',
      checksum:
        'sha256:237c5b25a32afbba22467c12f3bd674c0452d1956794eb2ce02ff8012fe087eb',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '35761033',
      pageUrl:
        'https://www.pexels.com/photo/joyful-woman-smiling-outdoors-in-sunny-park-35761033/',
    },
  },
  {
    storyId: 'story.bulk.0117',
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0117.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0117.2026-08-24.jpg',
      checksum:
        'sha256:b3719326f2e673e17a2dae2efa441aaadc72c74c7f4bfcf5760d3cef4910bfe2',
      width: 1024,
      height: 1024,
      altText: 'Люди стоят у окна, за которым виден снег.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '10612264',
      pageUrl:
        'https://www.pexels.com/photo/cold-snow-light-landscape-10612264/',
    },
  },
  {
    storyId: 'story.bulk.0118',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0118.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0118.2026-08-23.jpg',
      checksum:
        'sha256:725ba51cc315c5584ddb17cf308b53a3fde7edeab0cfa4427ac488124ae18cae',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29052604',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-with-long-hair-outdoors-29052604/',
    },
  },
  {
    storyId: 'story.bulk.0119',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0119.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0119.2026-08-24.jpg',
      checksum:
        'sha256:a79173e61cb1ed29cd173695948492693844fb06360af6530f8be4b1e11de6d9',
      width: 1024,
      height: 1024,
      altText: 'Женщина с плёночным фотоаппаратом стоит в тёмном коридоре.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '32346391',
      pageUrl:
        'https://www.pexels.com/photo/moody-indoor-portrait-with-vintage-camera-32346391/',
    },
  },
  {
    storyId: 'story.bulk.0120',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0120.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0120.2026-08-23.jpg',
      checksum:
        'sha256:0b5c391c1c688f30767519f379b227d7b5af309efc326a99c92e49d9e6d8584c',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29073588',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-with-long-curly-hair-outdoors-29073588/',
    },
  },
  {
    storyId: 'story.bulk.0121',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0121.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0121.2026-08-24.jpg',
      checksum:
        'sha256:6f0fb0cb60e6bdf418385d674a02127f6e3718ad5d39724e17c4ec5fb5e58b3f',
      width: 1024,
      height: 1024,
      altText: 'Женщина ждёт приближающийся поезд под станционными часами.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17749317',
      pageUrl:
        'https://www.pexels.com/photo/woman-and-train-at-railway-station-17749317/',
    },
  },
  {
    storyId: 'story.bulk.0122',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0122.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0122.2026-08-23.jpg',
      checksum:
        'sha256:33acaf4dbb0f6fc05e3fa99af1c1a8a48363009c31b21839d2d5f9d0e34e508f',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '28806780',
      pageUrl:
        'https://www.pexels.com/photo/casual-portrait-of-smiling-woman-by-window-28806780/',
    },
  },
  {
    storyId: 'story.bulk.0123',
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0123.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0123.2026-08-23.jpg',
      checksum:
        'sha256:9c71c272a15053a83e0001d6fd00f545285b5a151e95b8b4233c6ebeb050e302',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '12995093',
      pageUrl:
        'https://www.pexels.com/photo/a-man-walking-on-a-street-in-a-city-12995093/',
    },
  },
  {
    storyId: 'story.bulk.0124',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0124.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0124.2026-08-23.jpg',
      checksum:
        'sha256:394410b5e87a22b2cd9ca1e83a462a4d6749ecf1b57b23701601567be7b86301',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '34688328',
      pageUrl:
        'https://www.pexels.com/photo/relaxed-woman-enjoying-sunlight-by-window-34688328/',
    },
  },
  {
    storyId: 'story.bulk.0125',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0125.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0125.2026-08-23.jpg',
      checksum:
        'sha256:8deae7e0f3990034eaacc7e0d464e4253739d7478072e3ef5b3301d683e773f7',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '63',
      pageUrl: 'https://unsplash.com/photos/ZJsseAxEcqM',
      author: 'Justin Leibow',
    },
  },
  {
    storyId: 'story.bulk.0126',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0126.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0126.2026-08-23.jpg',
      checksum:
        'sha256:e1e9ee984e3197d605c565f303478a7704c9f6b5e1cb10f42b52baf7488bca48',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '32256827',
      pageUrl:
        'https://www.pexels.com/photo/stylish-woman-posing-against-colorful-background-32256827/',
    },
  },
  {
    storyId: 'story.bulk.0127',
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0127.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0127.2026-08-23.jpg',
      checksum:
        'sha256:3eefc9f53a25a109d941f6f4070ab05d7e837b4ee9f0bc6d5c0b88a9cb4bedaa',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '129',
      pageUrl: 'https://unsplash.com/photos/A88emaZe7d8',
      author: 'Charlie Foster',
    },
  },
  {
    storyId: 'story.bulk.0128',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0128.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0128.2026-08-23.jpg',
      checksum:
        'sha256:518cd48c23be491e5ffb0349b13e8915041519167f318166204c33592bc106fa',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '32159617',
      pageUrl:
        'https://www.pexels.com/photo/young-woman-posing-by-window-with-natural-light-32159617/',
    },
  },
  {
    storyId: 'story.bulk.0129',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0129.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0129.2026-08-24.jpg',
      checksum:
        'sha256:cec152ad41a24aecc2ecf55b6e1ec53a8deba8fb9667210bdc02f1b6ef97da22',
      width: 1024,
      height: 1024,
      altText: 'Женщина держит архивные папки у книжных полок.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11259801',
      pageUrl:
        'https://www.pexels.com/photo/girl-in-old-fashioned-dress-standing-in-library-holding-books-11259801/',
    },
  },
  {
    storyId: 'story.bulk.0130',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0130.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0130.2026-08-23.jpg',
      checksum:
        'sha256:1dff05f7e5e48aa179b19461116e019d2b861f6220c6febbbdde5946b8cf057e',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '34879199',
      pageUrl:
        'https://www.pexels.com/photo/relaxed-woman-enjoying-sunlight-by-window-34879199/',
    },
  },
  {
    storyId: 'story.bulk.0131',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0131.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0131.2026-08-24.jpg',
      checksum:
        'sha256:0d06d711dfccbaead2859e6c68a2024fcaff30c53c081b4970fa96906fc5976f',
      width: 1024,
      height: 1024,
      altText: 'Женщина стоит среди проявленных плёнок в фотолаборатории.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '10273454',
      pageUrl:
        'https://www.pexels.com/photo/woman-in-a-darkroom-with-hanging-cut-films-in-the-background-10273454/',
    },
  },
  {
    storyId: 'story.bulk.0132',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0132.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0132.2026-08-23.jpg',
      checksum:
        'sha256:cdb86723f9a86afc910b43a5e6eea7a976390a1e442e193ddd51ca226b3cbb79',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29655981',
      pageUrl:
        'https://www.pexels.com/photo/stylish-woman-posing-against-colorful-backdrop-29655981/',
    },
  },
  {
    storyId: 'story.bulk.0133',
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0133.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0133.2026-08-24.jpg',
      checksum:
        'sha256:7bd84cfe859eacc62d099581d1bc607639344ec306f85a1f97b4191f5c9af062',
      width: 1024,
      height: 1024,
      altText: 'Женщина идёт через тихий двор жилого дома.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17501537',
      pageUrl:
        'https://www.pexels.com/photo/woman-walking-on-the-pavement-between-the-building-and-parking-lot-in-city-17501537/',
    },
  },
  {
    storyId: 'story.bulk.0134',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0134.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0134.2026-08-23.jpg',
      checksum:
        'sha256:4245dd9eea93dd550d93e68d381f0bd0a7a98b3cc153fc7e380e2e3bc5ae7e6b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '15573105',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-in-top-15573105/',
    },
  },
  {
    storyId: 'story.bulk.0135',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0135.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0135.2026-08-23.jpg',
      checksum:
        'sha256:e206581d41a1fbcbaa72fdc0d2637c79cdcb839c3aef8bb13f1c791c674b51d6',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '134',
      pageUrl: 'https://unsplash.com/photos/Osl4I3IS9Cw',
      author: 'Charlie Foster',
    },
  },
  {
    storyId: 'story.bulk.0136',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0136.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0136.2026-08-23.jpg',
      checksum:
        'sha256:91c001c70b58f721a59342278cca56c2bd37e168473d81192d27c5085fb4ca66',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '33082868',
      pageUrl:
        'https://www.pexels.com/photo/stylish-portrait-of-a-confident-woman-on-red-background-33082868/',
    },
  },
  {
    storyId: 'story.bulk.0137',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0137.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0137.2026-08-24.jpg',
      checksum:
        'sha256:ed66b207d1143f52a93ddc67e2f558231c4997165b52e1686a614b1889fb8f72',
      width: 1024,
      height: 1024,
      altText: 'Женщина внимательно читает рукописное письмо в комнате.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6924667',
      pageUrl: 'https://www.pexels.com/photo/a-woman-reading-a-letter-6924667/',
    },
  },
  {
    storyId: 'story.bulk.0138',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0138.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0138.2026-08-23.jpg',
      checksum:
        'sha256:47f648d5fa08f38737884719404b0a8fbc466c6c316ba54a8047ac25ea19318b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '28482138',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-in-cozy-sweater-indoors-28482138/',
    },
  },
  {
    storyId: 'story.bulk.0139',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0139.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0139.2026-08-24.jpg',
      checksum:
        'sha256:085caf1a1def35557fdff07b7be603ab7629141305379721aad2b4100eb8227b',
      width: 1024,
      height: 1024,
      altText: 'Человек смотрит наружу из окна жилого дома.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11363898',
      pageUrl:
        'https://www.pexels.com/photo/person-looking-outside-the-window-11363898/',
    },
  },
  {
    storyId: 'story.bulk.0140',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0140.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0140.2026-08-23.jpg',
      checksum:
        'sha256:a59fd0c2f63e53aeeba5daec0e996f4ac592fde0e21df7030fd03248db33b3fb',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '30774974',
      pageUrl:
        'https://www.pexels.com/photo/young-woman-in-cozy-sweater-indoors-30774974/',
    },
  },
  {
    storyId: 'story.bulk.0141',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0141.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0141.2026-08-24.jpg',
      checksum:
        'sha256:9791598507d7a1af0c511b8ce73d2057a42242a7488ff578e5208ca22b2099d9',
      width: 1024,
      height: 1024,
      altText: 'Женщина складывает письмо в конверт за рабочим столом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '5899176',
      pageUrl:
        'https://www.pexels.com/photo/woman-putting-a-letter-in-an-envelope-5899176/',
    },
  },
  {
    storyId: 'story.bulk.0142',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0142.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0142.2026-08-23.jpg',
      checksum:
        'sha256:0354a8c0d2317a59092e2964549fbf3415f23dac9ae595827a8551fcaa0ee6d1',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '28942528',
      pageUrl:
        'https://www.pexels.com/photo/cozy-indoor-portrait-of-a-young-woman-28942528/',
    },
  },
  {
    storyId: 'story.bulk.0143',
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0143.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0143.2026-08-23.jpg',
      checksum:
        'sha256:73ee992a7ea010068af930ff2959e5fe3e9f53df4ebee803c7bc7891113a7495',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '197',
      pageUrl: 'https://unsplash.com/photos/n6TWNDfyPwk',
      author: 'Kholodnitskiy Maksim',
    },
  },
  {
    storyId: 'story.bulk.0144',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0144.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0144.2026-08-23.jpg',
      checksum:
        'sha256:1df1b4c5353eb80616b4970dcc1346bb3e2ac14bbda642c725b3de6be425ad1f',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '35633642',
      pageUrl:
        'https://www.pexels.com/photo/cozy-indoor-portrait-of-a-thoughtful-woman-35633642/',
    },
  },
  {
    storyId: 'story.bulk.0145',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0145.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0145.2026-08-24.jpg',
      checksum:
        'sha256:fc52fbad80435e119d969c5acf874cc73506773b039106880766f899f3dbfc67',
      width: 1024,
      height: 1024,
      altText: 'На старой стене сохранились обрывки выцветших афиш.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '4373993',
      pageUrl:
        'https://www.pexels.com/photo/old-grunge-wall-with-scraps-of-posters-in-town-4373993/',
    },
  },
  {
    storyId: 'story.bulk.0146',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0146.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0146.2026-08-23.jpg',
      checksum:
        'sha256:0aba1db9df06ebab6d5188a8e5b9dae67ed2b44e9be1ddf0c5a17a9aba6eaae0',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29990418',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-in-cozy-sweater-with-warm-lighting-29990418/',
    },
  },
  {
    storyId: 'story.bulk.0147',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0147.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0147.2026-08-24.jpg',
      checksum:
        'sha256:46f28e1698a25846ea5a3c9c6ad356d99730c47914d2a96998e63551d8ac69fb',
      width: 1024,
      height: 1024,
      altText: 'Женщина стоит на ночной платформе перед поездом метро.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17877328',
      pageUrl:
        'https://www.pexels.com/photo/woman-standing-on-the-subway-station-platform-17877328/',
    },
  },
  {
    storyId: 'story.bulk.0148',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0148.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0148.2026-08-23.jpg',
      checksum:
        'sha256:1b38791b84437d2a0edae6a70814d4fd9fa700e0c1839c0dbf96e7742c44ff9f',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '36465845',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-in-cozy-sweater-indoors-36465845/',
    },
  },
  {
    storyId: 'story.bulk.0149',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0149.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0149.2026-08-24.jpg',
      checksum:
        'sha256:c6bf08f6f4cc2134318849c2cc5e27743f3b93ad071cee58eed3d1204a20f330',
      width: 1024,
      height: 1024,
      altText: 'Женщина проверяет ноутбук в тёмном офисе поздно вечером.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '30215686',
      pageUrl:
        'https://www.pexels.com/photo/woman-working-late-on-laptop-in-dark-office-30215686/',
    },
  },
  {
    storyId: 'story.bulk.0150',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0150.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0150.2026-08-23.jpg',
      checksum:
        'sha256:2f652de9ad4428625f82e0133026afefbfdef8dda7f0a67080927a177470ab9d',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29162158',
      pageUrl:
        'https://www.pexels.com/photo/cozy-indoor-portrait-of-a-relaxed-woman-29162158/',
    },
  },
  {
    storyId: 'story.bulk.0151',
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0151.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0151.2026-08-23.jpg',
      checksum:
        'sha256:e2476deecbccb5a7b27dc89e5cf1d9cd61c3c701109189d08529fd08cc7066b6',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '20850075',
      pageUrl:
        'https://www.pexels.com/photo/man-walking-with-smartphone-in-city-20850075/',
    },
  },
  {
    storyId: 'story.bulk.0152',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0152.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0152.2026-08-23.jpg',
      checksum:
        'sha256:3213c71dc037f14ddea12a07fcf558ce88125a6b5ab68e446dead2ab20d85030',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '33806670',
      pageUrl:
        'https://www.pexels.com/photo/cozy-indoor-portrait-of-a-thoughtful-woman-33806670/',
    },
  },
  {
    storyId: 'story.bulk.0153',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0153.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0153.2026-08-24.jpg',
      checksum:
        'sha256:997a6ed0af5a9d16d10542f9d083dd5455c48d4bf4f72536392794d0cd4190a2',
      width: 1024,
      height: 1024,
      altText: 'Женщина достаёт и проверяет квитанции из кошелька.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '4968388',
      pageUrl:
        'https://www.pexels.com/photo/a-person-holding-a-wallet-4968388/',
    },
  },
  {
    storyId: 'story.bulk.0154',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0154.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0154.2026-08-23.jpg',
      checksum:
        'sha256:12a9e2396c08cffd223b246f3d36de3eacb574474a4e4337d561b62ea9db46f6',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6209640',
      pageUrl:
        'https://www.pexels.com/photo/a-portrait-of-a-woman-wearing-a-sweater-6209640/',
    },
  },
  {
    storyId: 'story.bulk.0155',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0155.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0155.2026-08-24.jpg',
      checksum:
        'sha256:f5dcc8727643974bd6052e94fb3a1dc0e27729a14ec49e340c171d35c11ddb50',
      width: 1024,
      height: 1024,
      altText: 'Женщина заглядывает в открытый шкафчик.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '5000221',
      pageUrl:
        'https://www.pexels.com/photo/a-woman-changing-in-a-locker-room-5000221/',
    },
  },
  {
    storyId: 'story.bulk.0156',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0156.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0156.2026-08-23.jpg',
      checksum:
        'sha256:e2de445732da0271ee2baa9c1d8616e52a217b1b602564324531b166050818e1',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6976935',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-smiling-woman-with-yellow-background-6976935/',
    },
  },
  {
    storyId: 'story.bulk.0157',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0157.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0157.2026-08-24.jpg',
      checksum:
        'sha256:fce158294351c6590cfd5b45b707ecb884abe7b0a39500afc7e46e1641e19a16',
      width: 1024,
      height: 1024,
      altText: 'Женщина сидит на набережной напротив далёкого маяка.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '37154349',
      pageUrl:
        'https://www.pexels.com/photo/woman-sitting-by-seaside-with-lighthouse-view-37154349/',
    },
  },
  {
    storyId: 'story.bulk.0158',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0158.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0158.2026-08-23.jpg',
      checksum:
        'sha256:701b4cb7f2bc6ff15f9b4548987f703221623c47523d0db28f1fd12da2a9ff0f',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '8463371',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-beautiful-woman-on-blue-studio-background-8463371/',
    },
  },
  {
    storyId: 'story.bulk.0159',
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0159.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0159.2026-08-24.jpg',
      checksum:
        'sha256:a8af62981cec196fcf2951f78821bfd0990fba7a45b2d083da8f77350607166f',
      width: 1024,
      height: 1024,
      altText: 'Пассажиры ждут прибывающий поезд на ночной платформе.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6049048',
      pageUrl:
        'https://www.pexels.com/photo/people-waiting-for-train-on-the-platform-6049048/',
    },
  },
  {
    storyId: 'story.bulk.0160',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0160.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0160.2026-08-23.jpg',
      checksum:
        'sha256:634eed971095677e30139f66b10f985220fb55fb95d3fbc53865f037b4fafcec',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '23440392',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-smiling-woman-23440392/',
    },
  },
  {
    storyId: 'story.bulk.0161',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0161.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0161.2026-08-24.jpg',
      checksum:
        'sha256:ae9ed846bd51d56e94f5a764b52c307f5b9cf21c0877f123c1fe45f187e2cc7c',
      width: 1024,
      height: 1024,
      altText: 'Женщина записывает голосовое сообщение у микрофона.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6953663',
      pageUrl:
        'https://www.pexels.com/photo/woman-in-casual-stylish-outfit-recording-voice-with-microphone-6953663/',
    },
  },
  {
    storyId: 'story.bulk.0162',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0162.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0162.2026-08-23.jpg',
      checksum:
        'sha256:162ed357b5de87f16f62d55183fb4282f5f686e2727f33ae80832c97681e9d90',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '35390453',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-posing-against-yellow-backdrop-35390453/',
    },
  },
  {
    storyId: 'story.bulk.0163',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0163.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0163.2026-08-23.jpg',
      checksum:
        'sha256:9873f88de84850bc9531a34500eec49a4aefad1e2838bce109ef457c11a8c48b',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '153',
      pageUrl: 'https://unsplash.com/photos/xpkmxDGPz0Y',
      author: 'Charlie Foster',
    },
  },
  {
    storyId: 'story.bulk.0164',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0164.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0164.2026-08-23.jpg',
      checksum:
        'sha256:a41dbf2eb3a40f0deb792c3b2e254544472f8a94c6de30ce7a65c0f4521ba8e8',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '10411938',
      pageUrl:
        'https://www.pexels.com/photo/woman-on-yellow-background-10411938/',
    },
  },
  {
    storyId: 'story.bulk.0165',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0165.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0165.2026-08-24.jpg',
      checksum:
        'sha256:039ae0fda0da7d9de5f3d34d91c37b7993fb220a61ab6329d7ee3eac2afd4df9',
      width: 1024,
      height: 1024,
      altText: 'Женщина отвечает на звонок за рабочим столом у окна.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '4240509',
      pageUrl:
        'https://www.pexels.com/photo/woman-having-a-phone-call-in-home-office-4240509/',
    },
  },
  {
    storyId: 'story.bulk.0166',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0166.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0166.2026-08-23.jpg',
      checksum:
        'sha256:77e173493a515faddc1ccdd31db8f3be629f782cd185db2d0c0add3718a1c7f6',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '12564874',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-on-yellow-background-12564874/',
    },
  },
  {
    storyId: 'story.bulk.0167',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0167.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0167.2026-08-24.jpg',
      checksum:
        'sha256:df3c85c69d555c9f81663dc23c45a327e090729f379ab2b8bd2011b62a836f41',
      width: 1024,
      height: 1024,
      altText: 'Женщина изучает развёрнутую карту с отметками.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '20232075',
      pageUrl:
        'https://www.pexels.com/photo/woman-holding-a-map-in-a-forest-20232075/',
    },
  },
  {
    storyId: 'story.bulk.0168',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0168.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0168.2026-08-24.jpg',
      checksum:
        'sha256:5aadfc9c804e4c9fac99d5eaa5ef78ffe5b48aa0a5a23318b1a7ca1aea045717',
      width: 1024,
      height: 1024,
      altText: 'Женщина пишет письмо у светлого окна.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '37713503',
      pageUrl:
        'https://www.pexels.com/photo/elegant-woman-writing-by-window-in-soft-light-37713503/',
    },
  },
  {
    storyId: 'story.bulk.0169',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0169.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0169.2026-08-24.jpg',
      checksum:
        'sha256:cf277d7c59401abc04d5ac0469ab9a2bf77c34366c397752e87cb8ca694585e1',
      width: 1024,
      height: 1024,
      altText: 'Женщина ищет нужную папку среди архивных полок.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '3791242',
      pageUrl:
        'https://www.pexels.com/photo/pondering-female-secretary-picking-folder-in-workplace-3791242/',
    },
  },
  {
    storyId: 'story.bulk.0170',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0170.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0170.2026-08-23.jpg',
      checksum:
        'sha256:f5ae5c676acf83d51b89ca2d82c0dbf6a2d6303fe4e12b1b69d2a996393657cb',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '8498327',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-smiling-woman-in-yellow-suit-8498327/',
    },
  },
  {
    storyId: 'story.bulk.0171',
    category: 'interior',
    asset: {
      assetId: 'cover.story.bulk.0171.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0171.2026-08-24.jpg',
      checksum:
        'sha256:9ca19b278a90cc1a83e759dd6456983cf563826e3f0f2903d1842b79f692e109',
      width: 1024,
      height: 1024,
      altText: 'Одинокие стулья стоят в пустом тёмном коридоре.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '18446450',
      pageUrl:
        'https://www.pexels.com/photo/chairs-in-an-empty-corridor-18446450/',
    },
  },
  {
    storyId: 'story.bulk.0172',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0172.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0172.2026-08-23.jpg',
      checksum:
        'sha256:315267472fc32856265475efff00c067df7af89bd0033020c198837b44c98cf4',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '16459024',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-smiling-woman-16459024/',
    },
  },
  {
    storyId: 'story.bulk.0173',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0173.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0173.2026-08-24.jpg',
      checksum:
        'sha256:95187a64887341406b88b5b531531e99ce9ea7d48a197779296a87a81e91bd34',
      width: 1024,
      height: 1024,
      altText: 'Женщина проверяет содержимое шкафчика в полутёмной комнате.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '5941813',
      pageUrl:
        'https://www.pexels.com/photo/a-side-view-of-a-woman-standing-at-the-locker-room-5941813/',
    },
  },
  {
    storyId: 'story.bulk.0174',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0174.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0174.2026-08-23.jpg',
      checksum:
        'sha256:be39d8d52d8f438dab86ad6f05db6a77a56f7baffc36ee01b541d654e17f70c3',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29347981',
      pageUrl:
        'https://www.pexels.com/photo/warm-outdoor-portrait-of-smiling-woman-at-sunset-29347981/',
    },
  },
  {
    storyId: 'story.bulk.0175',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0175.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0175.2026-08-23.jpg',
      checksum:
        'sha256:dbeccf3864dedc5b5859a11bfddf41b43e888ff7b4dcf6046a2346e3dbea57d5',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '164',
      pageUrl: 'https://unsplash.com/photos/agkblvPff5U',
      author: 'Linh Nguyen',
    },
  },
  {
    storyId: 'story.bulk.0176',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0176.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0176.2026-08-23.jpg',
      checksum:
        'sha256:93e43ea872e57a9db717c44dd08cc747c12b013e3d6978b8cad4205341de5440',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '23945349',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-with-camera-23945349/',
    },
  },
  {
    storyId: 'story.bulk.0177',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0177.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0177.2026-08-24.jpg',
      checksum:
        'sha256:48321b3b7a01cb9e46db3396b42f62e02446974d7f5c6be3d3a1dea2bc6599d2',
      width: 1024,
      height: 1024,
      altText: 'Женщина видна в одном из окон серого жилого дома.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '27067462',
      pageUrl:
        'https://www.pexels.com/photo/windows-of-gray-building-27067462/',
    },
  },
  {
    storyId: 'story.bulk.0178',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0178.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0178.2026-08-23.jpg',
      checksum:
        'sha256:e5d74c4b63065159b61c658dd0a8c4abac576d7ef62fc52ded1e64f6f5860b14',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '16008399',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-with-camera-16008399/',
    },
  },
  {
    storyId: 'story.bulk.0179',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0179.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0179.2026-08-24.jpg',
      checksum:
        'sha256:076f94f51535b94608ebf52e59952c1c8fb70c3887e3045d64f60103dd566847',
      width: 1024,
      height: 1024,
      altText: 'Женщина стоит у зимнего окна в тихой комнате ожидания.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '15186396',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-behind-a-window-in-black-and-white-15186396/',
    },
  },
  {
    storyId: 'story.bulk.0180',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0180.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0180.2026-08-23.jpg',
      checksum:
        'sha256:a62297c1ee0eab2c68fc20821cc7f84b550756f0e50ec27635fd3b026a994291',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '35888638',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-woman-holding-a-camera-35888638/',
    },
  },
  {
    storyId: 'story.bulk.0181',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0181.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0181.2026-08-24.jpg',
      checksum:
        'sha256:89e28e0884f849f8dd40d18ed99f1acadb6c06f3cb581d08efa5c4a12e9c3eee',
      width: 1024,
      height: 1024,
      altText:
        'Женщина рассматривает отражение со старым фотоаппаратом в руках.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '14304594',
      pageUrl:
        'https://www.pexels.com/photo/woman-holding-a-vintage-camera-14304594/',
    },
  },
  {
    storyId: 'story.bulk.0182',
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0182.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0182.2026-08-24.jpg',
      checksum:
        'sha256:ff0a458649ec7efb1c0174ff5c67506e199482574d9569c4ac651e8225a512c6',
      width: 1024,
      height: 1024,
      altText: 'Одинокий пассажир ждёт на тёмной платформе у рельсов.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11032069',
      pageUrl:
        'https://www.pexels.com/photo/a-person-waiting-at-a-subway-platform-11032069/',
    },
  },
  {
    storyId: 'story.bulk.0183',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0183.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0183.2026-08-23.jpg',
      checksum:
        'sha256:d40c646d260d9ec1a040938cce44cf886b6a9c99478847161a9b6645210544f7',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '193',
      pageUrl: 'https://unsplash.com/photos/d6ebY-faOO0',
      author: 'Vadim Sherbakov',
    },
  },
  {
    storyId: 'story.bulk.0184',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0184.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0184.2026-08-23.jpg',
      checksum:
        'sha256:426a61126ff916b5bc10c872355b2c68c11157a3790676fb3e9faee1be8c5067',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '3757035',
      pageUrl:
        'https://www.pexels.com/photo/portrait-photo-of-woman-holding-her-headphones-3757035/',
    },
  },
  {
    storyId: 'story.bulk.0185',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0185.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0185.2026-08-24.jpg',
      checksum:
        'sha256:e322420a64844eb8ba23e34c469c7772119808bf17f815ff579013df70114d80',
      width: 1024,
      height: 1024,
      altText: 'Женщина держит старый плёночный фотоаппарат в помещении.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29932832',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-holding-vintage-camera-indoors-29932832/',
    },
  },
  {
    storyId: 'story.bulk.0186',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0186.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0186.2026-08-23.jpg',
      checksum:
        'sha256:7c0875d4b8a308c3c0ad161918e16eca229fd28f5956933a8c1ebd964f2c5f93',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17871513',
      pageUrl: 'https://www.pexels.com/photo/woman-with-camera-17871513/',
    },
  },
  {
    storyId: 'story.bulk.0187',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0187.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0187.2026-08-24.jpg',
      checksum:
        'sha256:a3b514f9f158acbad879d54544a8ca12aef6d6ac84107026bf5deb7fee0b17e4',
      width: 1024,
      height: 1024,
      altText: 'Женщина сосредоточенно работает в офисе поздней ночью.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '12903157',
      pageUrl:
        'https://www.pexels.com/photo/focused-woman-working-in-office-late-12903157/',
    },
  },
  {
    storyId: 'story.bulk.0188',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0188.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0188.2026-08-23.jpg',
      checksum:
        'sha256:b8b2b7268b4afe00358512fffa6250afebb56eabe3a6ea9c16f99ea1e1be5bb1',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '3934058',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-with-headphones-3934058/',
    },
  },
  {
    storyId: 'story.bulk.0189',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0189.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0189.2026-08-24.jpg',
      checksum:
        'sha256:f94662e3df82821f0ecd589fb0b4716e2c10292ba09a837d5f6253064b6233ca',
      width: 1024,
      height: 1024,
      altText: 'Женщина настраивает старое радио в уютной комнате.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '34576470',
      pageUrl:
        'https://www.pexels.com/photo/young-woman-adjusting-vintage-radio-in-cozy-room-34576470/',
    },
  },
  {
    storyId: 'story.bulk.0190',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0190.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0190.2026-08-23.jpg',
      checksum:
        'sha256:bbd810a07316957f29db9ac3ffcc0aee68ea4124b0cdcd09d19b9ad61870ecfb',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '16160871',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-with-black-hair-16160871/',
    },
  },
  {
    storyId: 'story.bulk.0191',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0191.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0191.2026-08-23.jpg',
      checksum:
        'sha256:f86a568fc57c4b21a58034fa7d8b05c20aaee6c0cca5d138af91626bd42bfce8',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '195',
      pageUrl: 'https://unsplash.com/photos/t05kfHeygbE',
      author: 'Matthew Skinner',
    },
  },
  {
    storyId: 'story.bulk.0192',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0192.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0192.2026-08-23.jpg',
      checksum:
        'sha256:d9b29333f903d4728db83e6df2ce43ec127b1ba3b9f5f5fcb4d0ec78e746af16',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '34669961',
      pageUrl:
        'https://www.pexels.com/photo/young-woman-with-short-hair-smiling-by-window-34669961/',
    },
  },
  {
    storyId: 'story.bulk.0193',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0193.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0193.2026-08-23.jpg',
      checksum:
        'sha256:d8c423200e0727a5d8a2b6e8c7f01721115e17f119c6f7d569e7a197c826133a',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '113',
      pageUrl: 'https://unsplash.com/photos/yZf1quatKCA',
      author: 'Zugr',
    },
  },
  {
    storyId: 'story.bulk.0194',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0194.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0194.2026-08-23.jpg',
      checksum:
        'sha256:ebe399c1c92aaf77a8e761e2f73eb289ec73b27a49e9aad63df18af3e1b6619f',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '8101317',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-with-headphones-around-her-neck-8101317/',
    },
  },
  {
    storyId: 'story.bulk.0195',
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0195.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0195.2026-08-23.jpg',
      checksum:
        'sha256:4c6bce183199af8b4c5e16e100966479783dac5b2b0915b2d1c3d1d101bb95e7',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '259',
      pageUrl: 'https://unsplash.com/photos/hfIheOEJp9M',
      author: 'Namphuong Van',
    },
  },
  {
    storyId: 'story.bulk.0196',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0196.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0196.2026-08-23.jpg',
      checksum:
        'sha256:4c4a816f071eabb5a2c04281ad996761284b40e0f55239861ecbb71735ed0776',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '7711561',
      pageUrl:
        'https://www.pexels.com/photo/a-woman-with-curly-hair-smiling-at-the-camera-7711561/',
    },
  },
  {
    storyId: 'story.bulk.0197',
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0197.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0197.2026-08-24.jpg',
      checksum:
        'sha256:0eaa8a1126bc5d853e181ccce3b0e99b9a5b6be3e17f5d5b8b715d501bed659c',
      width: 1024,
      height: 1024,
      altText: 'Люди ждут поезд на тихой станции ночью.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '18454228',
      pageUrl:
        'https://www.pexels.com/photo/people-waiting-on-train-platform-at-night-18454228/',
    },
  },
  {
    storyId: 'story.bulk.0198',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0198.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0198.2026-08-23.jpg',
      checksum:
        'sha256:67861a894785a18a0334b0c0a87bbac3cb220ecb32c0915babcd556a9f0153fe',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '30836939',
      pageUrl:
        'https://www.pexels.com/photo/contemporary-portrait-of-woman-with-short-hair-30836939/',
    },
  },
  {
    storyId: 'story.bulk.0199',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0199.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0199.2026-08-23.jpg',
      checksum:
        'sha256:e1a195e2222b7ea4f56c39e9a6a9fee706d94e1a8230487d24e04dae57d2d0cb',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '214',
      pageUrl: 'https://unsplash.com/photos/Ereoqdv5s48',
      author: 'Kelly Sikkema',
    },
  },
  {
    storyId: 'story.bulk.0200',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0200.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0200.2026-08-23.jpg',
      checksum:
        'sha256:42cc8c82c81068c64bffd1d240dae255cc7ab0100b232c3c453e0991f3da60eb',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '10745863',
      pageUrl:
        'https://www.pexels.com/photo/portrait-photo-of-short-haired-woman-10745863/',
    },
  },
  {
    storyId: 'story.bulk.0201',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0201.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0201.2026-08-24.jpg',
      checksum:
        'sha256:fea68a61911c3f3ee7060521345cdb8885d921ab6850b57fbe107b0229576136',
      width: 1024,
      height: 1024,
      altText: 'Женщина проверяет старый фотоаппарат в комнате.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '33010399',
      pageUrl:
        'https://www.pexels.com/photo/woman-taking-photo-with-vintage-camera-indoors-33010399/',
    },
  },
  {
    storyId: 'story.bulk.0202',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0202.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0202.2026-08-23.jpg',
      checksum:
        'sha256:893b51da2a976d8e4bbe41a196f380bbae7d5affb74397b7ae8a07207e97a737',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '32342052',
      pageUrl:
        'https://www.pexels.com/photo/elegant-portrait-of-a-woman-in-natural-light-32342052/',
    },
  },
  {
    storyId: 'story.bulk.0203',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0203.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0203.2026-08-24.jpg',
      checksum:
        'sha256:46c8340ebe09fd0a2a2127f5d4c49757e55a26730b40d10a7dd5a935b7d14e9f',
      width: 1024,
      height: 1024,
      altText: 'Женщина смотрит из окна старого дома во двор напротив.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '15730774',
      pageUrl:
        'https://www.pexels.com/photo/woman-looking-out-of-house-window-15730774/',
    },
  },
  {
    storyId: 'story.bulk.0204',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0204.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0204.2026-08-23.jpg',
      checksum:
        'sha256:e66ab4f44eb26a4c123ff98190dde31994ec3b09cff2a1398b7a8920bdb2598b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19312460',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-beautiful-brunette-wearing-headphones-around-the-neck-19312460/',
    },
  },
  {
    storyId: 'story.bulk.0205',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0205.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0205.2026-08-24.jpg',
      checksum:
        'sha256:a0477d934c5940c0a6e20d909bfbebc2f178a5fa61e56c3093d559f1e70921eb',
      width: 1024,
      height: 1024,
      altText: 'Женщина заканчивает работу у рыночного прилавка ночью.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19306750',
      pageUrl: 'https://www.pexels.com/photo/a-woman-at-work-19306750/',
    },
  },
  {
    storyId: 'story.bulk.0206',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0206.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0206.2026-08-23.jpg',
      checksum:
        'sha256:6a486b2eadf3aefce714af90b8ebabcaf4e99dd7e4c354cddbf1c2954aaf4999',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17873680',
      pageUrl:
        'https://www.pexels.com/photo/woman-holding-headphone-on-neck-17873680/',
    },
  },
  {
    storyId: 'story.bulk.0207',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0207.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0207.2026-08-24.jpg',
      checksum:
        'sha256:01a894da6ee3b16b943d3db9abbc8fe44e2d9390e5a718b4647769c04a8b51bf',
      width: 1024,
      height: 1024,
      altText: 'Женщина стоит на речном причале на фоне городских зданий.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '28683726',
      pageUrl:
        'https://www.pexels.com/photo/stylish-woman-on-dock-with-urban-waterfront-view-28683726/',
    },
  },
  {
    storyId: 'story.bulk.0208',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0208.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0208.2026-08-23.jpg',
      checksum:
        'sha256:9ea853ae12623fede37649268f8a7b308d266ffd6bddb2143461ad768ae59818',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19996822',
      pageUrl:
        'https://www.pexels.com/photo/a-woman-with-curly-red-hair-posing-for-a-photo-19996822/',
    },
  },
  {
    storyId: 'story.bulk.0209',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0209.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0209.2026-08-23.jpg',
      checksum:
        'sha256:36505b749f3a9aa04c9db5df33dd53fd6e333081fbbc1132c00cb9e4ce4f281d',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '145',
      pageUrl: 'https://unsplash.com/photos/VkuuTRkcRqw',
      author: 'Lucas Boesche',
    },
  },
  {
    storyId: 'story.bulk.0210',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0210.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0210.2026-08-23.jpg',
      checksum:
        'sha256:c09eaecb5bffbb300769c1f71224b283ecc9b551adad2debd44f570e3843d445',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29720556',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-woman-with-curly-red-hair-in-natural-light-29720556/',
    },
  },
  {
    storyId: 'story.bulk.0211',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0211.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0211.2026-08-24.jpg',
      checksum:
        'sha256:ddabfc2f6975cd1425da4c38c946e96a36dbbccca059bda7fba2f64d7d84cc53',
      width: 1024,
      height: 1024,
      altText: 'Женщина проверяет сообщение на телефоне в ночном офисе.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '36713414',
      pageUrl:
        'https://www.pexels.com/photo/businesswoman-using-smartphone-in-office-at-night-36713414/',
    },
  },
  {
    storyId: 'story.bulk.0212',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0212.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0212.2026-08-23.jpg',
      checksum:
        'sha256:7bb714458c4971302812dbe05753083f83e2c61283a93d0332be9530141d8aa9',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6263722',
      pageUrl:
        'https://www.pexels.com/photo/fashion-sunglasses-woman-girl-6263722/',
    },
  },
  {
    storyId: 'story.bulk.0213',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0213.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0213.2026-08-24.jpg',
      checksum:
        'sha256:45748b2900a03c2b3a70dec150c0f30d6c368d0e5a1ed7afa78e16238bf3e3f5',
      width: 1024,
      height: 1024,
      altText: 'Женщина читает старую запись в тихой библиотеке.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '31570982',
      pageUrl:
        'https://www.pexels.com/photo/vintage-style-woman-reading-in-a-library-31570982/',
    },
  },
  {
    storyId: 'story.bulk.0214',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0214.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0214.2026-08-23.jpg',
      checksum:
        'sha256:a71495ec8f95b1f21ea58bb57989af341c7c2cd2249330f24295a26c38be2554',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19312455',
      pageUrl:
        'https://www.pexels.com/photo/young-brunette-wearing-headphones-around-her-neck-and-standing-beside-a-tropical-plant-19312455/',
    },
  },
  {
    storyId: 'story.bulk.0215',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0215.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0215.2026-08-24.jpg',
      checksum:
        'sha256:6ebeba6b5a3ad4ae544299088a4096911e8e1822498e6c7db60a77fffd8132b3',
      width: 1024,
      height: 1024,
      altText: 'Человек держит бумажный билет у себя на коленях.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '5801647',
      pageUrl:
        'https://www.pexels.com/photo/a-ticket-on-the-lap-of-a-person-5801647/',
    },
  },
  {
    storyId: 'story.bulk.0216',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0216.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0216.2026-08-23.jpg',
      checksum:
        'sha256:a5f230131b46f90818639ee947d43d947bac41a3a3928f6123d7bdd81182c713',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29557653',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-young-woman-with-red-curly-hair-29557653/',
    },
  },
  {
    storyId: 'story.bulk.0217',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0217.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0217.2026-08-24.jpg',
      checksum:
        'sha256:5c3e352f01e433905314c771972a8504e901d194491944245a91ad85f09bc334',
      width: 1024,
      height: 1024,
      altText: 'Женщина с зонтом ждёт на ночной автобусной остановке.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29801152',
      pageUrl:
        'https://www.pexels.com/photo/woman-with-umbrella-at-night-bus-stop-29801152/',
    },
  },
  {
    storyId: 'story.bulk.0218',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0218.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0218.2026-08-23.jpg',
      checksum:
        'sha256:67d4448e40615154caa0d19617f62d8adeda119d97208c25eb4b6ea750ff5b83',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '12659925',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-woman-smiling-12659925/',
    },
  },
  {
    storyId: 'story.bulk.0219',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0219.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0219.2026-08-24.jpg',
      checksum:
        'sha256:14ba4cd439430f2f998121396f62ab14975b920cbcb1598c6c679edf44f1f66d',
      width: 1024,
      height: 1024,
      altText: 'Женщина читает архивные документы при свете настольной лампы.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '8872552',
      pageUrl:
        'https://www.pexels.com/photo/a-woman-reading-documents-on-a-folder-8872552/',
    },
  },
  {
    storyId: 'story.bulk.0220',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0220.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0220.2026-08-23.jpg',
      checksum:
        'sha256:41a043ef6004111c848945308f31452e3a8c6a4373502bde0e2acf556e65dc9b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '36728897',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-with-curly-red-hair-in-studio-portrait-36728897/',
    },
  },
  {
    storyId: 'story.bulk.0221',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0221.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0221.2026-08-23.jpg',
      checksum:
        'sha256:51c1a5a3018456f6327b19b2c84e0f7eb0acc694897744bd0f333a1b33fc5c07',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '257',
      pageUrl: 'https://unsplash.com/photos/3EYK2njhLxc',
      author: 'Emanuele Pinna',
    },
  },
  {
    storyId: 'story.bulk.0222',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0222.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0222.2026-08-23.jpg',
      checksum:
        'sha256:58fd884a083b7bf8d17a05f029e9e7ac693d7ecf85c8a184078089b83c29e52d',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '3768915',
      pageUrl:
        'https://www.pexels.com/photo/photo-of-smiling-woman-in-yellow-turtleneck-sweater-with-headphones-on-her-neck-using-her-phone-3768915/',
    },
  },
  {
    storyId: 'story.bulk.0223',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0223.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0223.2026-08-23.jpg',
      checksum:
        'sha256:33e7b3f3a16ac73247ba21298414c0e2c9a8372b69a0804c757f695280362655',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '175',
      pageUrl: 'https://unsplash.com/photos/8hgm6mKK04U',
      author: 'petradr',
    },
  },
  {
    storyId: 'story.bulk.0224',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0224.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0224.2026-08-23.jpg',
      checksum:
        'sha256:9d59fd60146a5590c4e2027757c110925173d2af6859d3d57f6fb3a396286b9c',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '1987301',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-with-red-hair-1987301/',
    },
  },
  {
    storyId: 'story.bulk.0225',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0225.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0225.2026-08-24.jpg',
      checksum:
        'sha256:38fb5ff0f1b53ac0a8917e359b1fcdf7282676e44af34c2d77ff80e1df0fa3a8',
      width: 1024,
      height: 1024,
      altText: 'Женщина рассматривает плёночные негативы у окна в студии.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '7014250',
      pageUrl:
        'https://www.pexels.com/photo/smiling-young-woman-checking-images-on-negatives-in-light-studio-7014250/',
    },
  },
  {
    storyId: 'story.bulk.0226',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0226.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0226.2026-08-23.jpg',
      checksum:
        'sha256:454e6a23ecefa1c8ffce783d3f2a4c53d37daebc418b8a1fa04d8f77b4cf594b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17487030',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-with-curly-hair-17487030/',
    },
  },
  {
    storyId: 'story.bulk.0227',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0227.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0227.2026-08-24.jpg',
      checksum:
        'sha256:2f00ad74596d0a125a8d948dbc8c0e32adae0afca5fecef23ef5f1aaf8899c2d',
      width: 1024,
      height: 1024,
      altText: 'Женщина с балкона смотрит во двор старого дома.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '5989840',
      pageUrl:
        'https://www.pexels.com/photo/woman-standing-on-a-balcony-on-a-courtyard-and-looking-at-view-5989840/',
    },
  },
  {
    storyId: 'story.bulk.0228',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0228.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0228.2026-08-23.jpg',
      checksum:
        'sha256:ee4c48e3e4492cf68a80bca53cc8788770cb5f684f406fa115ab1c9cd26185b9',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19168298',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-smiling-woman-19168298/',
    },
  },
  {
    storyId: 'story.bulk.0229',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0229.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0229.2026-08-23.jpg',
      checksum:
        'sha256:48553f903a5cbf34b3925a2e0c93d04852d98e7bbdddab8434a82c817a509db6',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '299',
      pageUrl: 'https://unsplash.com/photos/nOhUx3tiaQQ',
      author: 'Matthew Wiebe',
    },
  },
  {
    storyId: 'story.bulk.0230',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0230.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0230.2026-08-23.jpg',
      checksum:
        'sha256:a3983ed8702b2125ddde5eaffaf3fe23e959c781ae1e2220a57e9b0485aa0a05',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '2291015',
      pageUrl:
        'https://www.pexels.com/photo/close-up-photography-of-smiling-woman-2291015/',
    },
  },
  {
    storyId: 'story.bulk.0231',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0231.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0231.2026-08-24.jpg',
      checksum:
        'sha256:5122a39a626cc741f975bd2512d3a3fb5770e8fcbb5764139c52b5b048745415',
      width: 1024,
      height: 1024,
      altText: 'Женщина читает между рядами архивных ящиков.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '6549365',
      pageUrl:
        'https://www.pexels.com/photo/woman-reading-a-book-between-archive-drawers-6549365/',
    },
  },
  {
    storyId: 'story.bulk.0232',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0232.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0232.2026-08-23.jpg',
      checksum:
        'sha256:4429f5d8bd74cb1cadb08155401c85039ae61743e3b74a0137827b9648c59a64',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11202369',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-smiling-girl-11202369/',
    },
  },
  {
    storyId: 'story.bulk.0233',
    category: 'interior',
    asset: {
      assetId: 'cover.story.bulk.0233.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0233.2026-08-24.jpg',
      checksum:
        'sha256:2a6cd01a8308509e34f50242ce0705fd8bbcd0b0e3a60cc75c125ea91ffdaf92',
      width: 1024,
      height: 1024,
      altText: 'В пустом ночном вагоне на сиденье лежит газета.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '29027875',
      pageUrl:
        'https://www.pexels.com/photo/empty-train-interior-with-newspaper-at-night-29027875/',
    },
  },
  {
    storyId: 'story.bulk.0234',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0234.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0234.2026-08-23.jpg',
      checksum:
        'sha256:240906dacf7919efe9d4e21c45e661e2e08d1fb55f1803ad84457c26adf1e6d8',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '5301008',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-girl-with-short-haircut-5301008/',
    },
  },
  {
    storyId: 'story.bulk.0235',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0235.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0235.2026-08-24.jpg',
      checksum:
        'sha256:be6f94ae98be107d975152443f121e2e35b954344c7de04901c88bc2575bc776',
      width: 1024,
      height: 1024,
      altText: 'Женщина в наушниках говорит в микрофон студии.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '7598558',
      pageUrl: 'https://www.pexels.com/photo/a-woman-in-a-studio-7598558/',
    },
  },
  {
    storyId: 'story.bulk.0236',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0236.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0236.2026-08-23.jpg',
      checksum:
        'sha256:f3f9bea17824f6142f1a64325fd32a3968091d8586d67ae55bca5e0d9f9254a1',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '5301009',
      pageUrl:
        'https://www.pexels.com/photo/young-woman-wearing-a-white-turtleneck-5301009/',
    },
  },
  {
    storyId: 'story.bulk.0237',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0237.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0237.2026-08-23.jpg',
      checksum:
        'sha256:828a71221eef5b9276428dc82a200a8104ab8191fa482ed9e5632f00c3af33fa',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '12426839',
      pageUrl:
        'https://www.pexels.com/photo/a-beautiful-woman-with-bob-haircut-12426839/',
    },
  },
  {
    storyId: 'story.bulk.0238',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0238.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0238.2026-08-24.jpg',
      checksum:
        'sha256:437bbd67c32fb5e6c4ac1701f9cf661ad4471fdeaaebf56f1fe2f49f10af1737',
      width: 1024,
      height: 1024,
      altText: 'Женщина проходит мимо витрины и афиш в городском переулке.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '31321191',
      pageUrl:
        'https://www.pexels.com/photo/young-woman-walking-in-european-alley-with-shop-reflection-31321191/',
    },
  },
  {
    storyId: 'story.bulk.0239',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0239.2026-08-24',
      kind: 'cover',
      path: 'story-previews/story.bulk.0239.2026-08-24.jpg',
      checksum:
        'sha256:d0b78783a1d743faab04ae2efdc2ec8038cd05e0834426931ecd4d4ec4d3127d',
      width: 1024,
      height: 1024,
      altText: 'Женщина работает в мастерской за большим окном-витриной.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '14452735',
      pageUrl:
        'https://www.pexels.com/photo/artisan-at-work-in-store-window-14452735/',
    },
  },
  {
    storyId: 'story.bulk.0240',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0240.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0240.2026-08-23.jpg',
      checksum:
        'sha256:3bbdb9eedb06b2b25da20bfd6a36aed5cd48cdcf42f2ac9adc1bdb916ef81e79',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '4094744',
      pageUrl: 'https://www.pexels.com/photo/woman-with-freckles-4094744/',
    },
  },
]

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
