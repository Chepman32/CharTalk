import type { ContentAsset } from '@chartalk/content-schema'

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
  'Curated and contact-sheet reviewed for the bundled catalog on 2026-08-23.'

export const storyPreviewDefinitions: readonly StoryPreviewDefinition[] = [
  {
    storyId: 'story.ira.after-deadline',
    category: 'woman',
    asset: {
      assetId: 'cover.story.ira.after-deadline.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.ira.after-deadline.2026-08-23.jpg',
      checksum:
        'sha256:21ecab575d60a56f2c7845ea28e9b472dc88be13953b5f04c33124dc3d451cb3',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '4512510',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-redhead-woman-4512510/',
    },
  },
  {
    storyId: 'story.asya.seven-minutes',
    category: 'building',
    asset: {
      assetId: 'cover.story.asya.seven-minutes.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.asya.seven-minutes.2026-08-23.jpg',
      checksum:
        'sha256:9ca8dc835bad70d8d79272bdce8565b180e468395b8dbf2ef16dd94aa82e0c9c',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '49',
      pageUrl: 'https://unsplash.com/photos/Qo51KwK1dKg',
      author: 'Margaret Barley',
    },
  },
  {
    storyId: 'story.dina.three-knocks',
    category: 'woman',
    asset: {
      assetId: 'cover.story.dina.three-knocks.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.dina.three-knocks.2026-08-23.jpg',
      checksum:
        'sha256:ff2d1100b9cd314c0e30598e89e2afbac7d833eb9bcbf0c0b6eb8ac360286278',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '19748592',
      pageUrl: 'https://www.pexels.com/photo/smiling-redhead-woman-19748592/',
    },
  },
  {
    storyId: 'story.bulk.0001',
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0001.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0001.2026-08-23.jpg',
      checksum:
        'sha256:f84c613e713bbd56c1681059cb01eae65ac3cae69aa952130ada619a1f7c57a2',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '30494316',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-smiling-man-in-coffee-shop-setting-30494316/',
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
      assetId: 'cover.story.bulk.0003.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0003.2026-08-23.jpg',
      checksum:
        'sha256:6ecf6f7541be1dbec05618c3e3e035e99fb70f53f1541953db2a10cb47c38338',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '20',
      pageUrl: 'https://unsplash.com/photos/nJdwUHmaY8A',
      author: 'Aleks Dorohovich',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0005.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0005.2026-08-23.jpg',
      checksum:
        'sha256:fc9b3970714d5163787b3adc3cea74156931fc946ed81ccb17bec8ff3bdb2fff',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '22',
      pageUrl: 'https://unsplash.com/photos/du_OrQAA4r0',
      author: 'Alejandro Escamilla',
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
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0007.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0007.2026-08-23.jpg',
      checksum:
        'sha256:08876a90cd1f9cbaa75f76e9866d4ccff771a2d434b8cb78c506fb66253a3a84',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '45',
      pageUrl: 'https://unsplash.com/photos/-XA-fTYYfV0',
      author: 'Alan Haverty',
    },
  },
  {
    storyId: 'story.bulk.0008',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0008.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0008.2026-08-23.jpg',
      checksum:
        'sha256:47a71c04594b35a664b0414791e93121936cf03adc3ae53c2c330aea1cf3864b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '18709729',
      pageUrl: 'https://www.pexels.com/photo/smiling-redhead-woman-18709729/',
    },
  },
  {
    storyId: 'story.bulk.0009',
    category: 'interior',
    asset: {
      assetId: 'cover.story.bulk.0009.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0009.2026-08-23.jpg',
      checksum:
        'sha256:ed8a72506f70971f8aeb53e3c8f7040dc3eecfe1c9f1b08f9ccf4c59f70f3355',
      width: 1024,
      height: 1024,
      altText: 'Интерьер жилого или общественного пространства.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '42',
      pageUrl: 'https://unsplash.com/photos/KR2mdHJ5qMg',
      author: 'Luke Chesser',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0011.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0011.2026-08-23.jpg',
      checksum:
        'sha256:23553d3ef25056165168d1ecda24665a0fdd5d0fdabb92db81af5d35ded62e2b',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '35',
      pageUrl: 'https://unsplash.com/photos/znM0ujn2RUA',
      author: 'Shane Colella',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0013.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0013.2026-08-23.jpg',
      checksum:
        'sha256:ba636a46a2a3318c1a0313f96fb5726f08dc9b2ced011bb540cf6c5123102480',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '10',
      pageUrl: 'https://unsplash.com/photos/6J--NXulQCs',
      author: 'Paul Jarvis',
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
      assetId: 'cover.story.bulk.0018.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0018.2026-08-23.jpg',
      checksum:
        'sha256:671fb1f1e11c80abdab28a4d3adce67b3d36f167e3aeb1acee973720d6c1606e',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '15102540',
      pageUrl: 'https://www.pexels.com/photo/smiling-redhead-woman-15102540/',
    },
  },
  {
    storyId: 'story.bulk.0019',
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0019.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0019.2026-08-23.jpg',
      checksum:
        'sha256:d5a0d8902dbb454cb63d9012d8965e78e6b1ef0b28c67ac082ccea21644197a3',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '21',
      pageUrl: 'https://unsplash.com/photos/jVb0mSn0LbE',
      author: 'Alejandro Escamilla',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0021.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0021.2026-08-23.jpg',
      checksum:
        'sha256:550ad08c7768d010c1a38252044f84d24cc55022f2626e507faa15e6b3667345',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '25',
      pageUrl: 'https://unsplash.com/photos/Iuq0EL4EINY',
      author: 'Alejandro Escamilla',
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
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0023.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0023.2026-08-23.jpg',
      checksum:
        'sha256:a3e74eac6aa0a1b263502448e5b69a40d71a49df4464f349fa905e918838c3f5',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '85',
      pageUrl: 'https://unsplash.com/photos/xDrxJCdedcI',
      author: 'Gozha Net',
    },
  },
  {
    storyId: 'story.bulk.0024',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0024.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0024.2026-08-23.jpg',
      checksum:
        'sha256:cfd1d31a7243fc84cf30b98435d88fbacc867ff797289e48f8ff54e5b33eabb8',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '10558222',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-smiling-woman-in-glasses-10558222/',
    },
  },
  {
    storyId: 'story.bulk.0025',
    category: 'interior',
    asset: {
      assetId: 'cover.story.bulk.0025.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0025.2026-08-23.jpg',
      checksum:
        'sha256:6fd8d7ee33aeacafe3df562cb7cc2665e39bce393b9f686f0136585598e3e7a9',
      width: 1024,
      height: 1024,
      altText: 'Интерьер жилого или общественного пространства.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '163',
      pageUrl: 'https://unsplash.com/photos/oFAVqfTSby8',
      author: 'Linh Nguyen',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0027.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0027.2026-08-23.jpg',
      checksum:
        'sha256:1acf8860fd8b4c151bf7a491da1fd30c779dabf4e5582e98a2a7194a8864619a',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '40',
      pageUrl: 'https://unsplash.com/photos/N-1XGL54pQg',
      author: 'Ryan Mcguire',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0029.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0029.2026-08-23.jpg',
      checksum:
        'sha256:9f848d9f7a46fca5fb5db7357d759fc1ff4f55262c0a44605c6e8e3f00c3435c',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '15',
      pageUrl: 'https://unsplash.com/photos/NYDo21ssGao',
      author: 'Paul Jarvis',
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
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0031.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0031.2026-08-23.jpg',
      checksum:
        'sha256:e83cfd529f99baf83dbd84d32d4c5a5481b29b4a53a4d711e36c78faef59ca77',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '69',
      pageUrl: 'https://unsplash.com/photos/SITaCHf7jjg',
      author: 'Alexander Shustov',
    },
  },
  {
    storyId: 'story.bulk.0032',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0032.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0032.2026-08-23.jpg',
      checksum:
        'sha256:35a2c884b71a9f169f315b6f7faf49430162f38aa3e65a4216225cd308b1411e',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '11160000',
      pageUrl:
        'https://www.pexels.com/photo/a-portrait-of-a-woman-in-eyeglasses-at-a-restaurant-11160000/',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0035.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0035.2026-08-23.jpg',
      checksum:
        'sha256:e19c2a35487615882bff9c7bd5d16abd4589feda0a5f5121d43a453316f5d996',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '24',
      pageUrl: 'https://unsplash.com/photos/cZhUxIQjILg',
      author: 'Alejandro Escamilla',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0037.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0037.2026-08-23.jpg',
      checksum:
        'sha256:47fee9b350696af0089587b7a9e442cc36ef3d4a894cfa273b2522947f61deac',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '32',
      pageUrl: 'https://unsplash.com/photos/eG3k60PrTGY',
      author: 'Rodrigo Melo',
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
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0039.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0039.2026-08-23.jpg',
      checksum:
        'sha256:0c5d215335ac516978d4dced14338b3c70cef5cdd5fd5acbff74e202afe52bcf',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '111',
      pageUrl: 'https://unsplash.com/photos/eLUegVAjN7s',
      author: 'Gabe Rodriguez',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0043.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0043.2026-08-23.jpg',
      checksum:
        'sha256:c0304821e524b0119ad38c77d5bae737be2a929c4664dea5e8240e47a56ed5e1',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '80',
      pageUrl: 'https://unsplash.com/photos/Y2PYfopoz-k',
      author: 'Sonja Langford',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0045.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0045.2026-08-23.jpg',
      checksum:
        'sha256:75017498d6668df3b2711530afcacd5a2400db50cf360dfc1ea0288a27a97ac4',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '28',
      pageUrl: 'https://unsplash.com/photos/_WiFMBRT7Aw',
      author: 'Jerry Adney',
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
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0047.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0047.2026-08-23.jpg',
      checksum:
        'sha256:e0cdc77da8bb8fcc06b306678720939ef69de93ec48193b76a3b430dbc4a3c75',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '76',
      pageUrl: 'https://unsplash.com/photos/OxzhYtL-00Y',
      author: 'Alexander Shustov',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0051.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0051.2026-08-23.jpg',
      checksum:
        'sha256:cbc2a8e770eae57d576a39e022a4b140be3f6391c6be99b5849318c36d5e7199',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '26',
      pageUrl: 'https://unsplash.com/photos/tCICLJ5ktBE',
      author: 'Vadim Sherbakov',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0053.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0053.2026-08-23.jpg',
      checksum:
        'sha256:d36928a69cf61c3638413c2a56e2c6d1e8471c95331de286457955cf3c952af2',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '64',
      pageUrl: 'https://unsplash.com/photos/AHBiSKaENwc',
      author: 'Alexander Shustov',
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
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0055.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0055.2026-08-23.jpg',
      checksum:
        'sha256:c5c3ca22994591823c14f8518e9a94f0640168a0131d98e217c8e3b68dff2ec5',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '133',
      pageUrl: 'https://unsplash.com/photos/8Zt0xOOK4nI',
      author: 'Dietmar Becker',
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
    category: 'interior',
    asset: {
      assetId: 'cover.story.bulk.0057.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0057.2026-08-23.jpg',
      checksum:
        'sha256:0611611122bc2f7e817dd16b93a4033fc81cd6f694ca79036ebf0c694aa36546',
      width: 1024,
      height: 1024,
      altText: 'Интерьер жилого или общественного пространства.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '230',
      pageUrl: 'https://unsplash.com/photos/rFKUFzjPYiQ',
      author: 'Wes Carr',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0059.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0059.2026-08-23.jpg',
      checksum:
        'sha256:09f2ea93fe8fa6c12bbf8ce3b40f34b7ab40a70d7020b29b2967dbd83bc6616c',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '98',
      pageUrl: 'https://unsplash.com/photos/ThJIf6Q0b2s',
      author: 'Laurice Solomon',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0061.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0061.2026-08-23.jpg',
      checksum:
        'sha256:d311b6ef5ba5252368386da7ed771a534480f6c80d789fbb398509164782b600',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '29',
      pageUrl: 'https://unsplash.com/photos/V0yAek6BgGk',
      author: 'Go Wild',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0067.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0067.2026-08-23.jpg',
      checksum:
        'sha256:3de71d6b11a65b7f9603da1ee83e4875f1eb48edb6014d98be8712ecbd154dbc',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '30',
      pageUrl: 'https://unsplash.com/photos/aeVA-j1y2BY',
      author: 'Shyamanta Baruah',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0069.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0069.2026-08-23.jpg',
      checksum:
        'sha256:814c349c29682ec3ac9fd2e19420b373b57431f5c5f01e0027b68393c310258b',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '65',
      pageUrl: 'https://unsplash.com/photos/2FrX56QL7P8',
      author: 'Alexander Shustov',
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
      assetId: 'cover.story.bulk.0073.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0073.2026-08-23.jpg',
      checksum:
        'sha256:a7abf6f45596d63df5fc5a2b219066899f25022123ac8edaefde2946306c07fe',
      width: 1024,
      height: 1024,
      altText: 'Интерьер жилого или общественного пространства.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '305',
      pageUrl: 'https://unsplash.com/photos/B6uUPYt7wz4',
      author: 'Dominik Martin',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0075.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0075.2026-08-23.jpg',
      checksum:
        'sha256:d3f1d922dd5846a2baef71fdc86420d5500d187855f00614c53af9f6b1bfb9dd',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '159',
      pageUrl: 'https://unsplash.com/photos/kxqvE41_07k',
      author: 'Shyamanta Baruah',
    },
  },
  {
    storyId: 'story.bulk.0076',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0076.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0076.2026-08-23.jpg',
      checksum:
        'sha256:3b609194486d87ec7a94709b47a507da953e0a57fac42a8ebddcbf6e9fe6fde2',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '22702206',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-a-woman-smiling-22702206/',
    },
  },
  {
    storyId: 'story.bulk.0077',
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0077.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0077.2026-08-23.jpg',
      checksum:
        'sha256:214e3fc7f1ec68c4d9deee2c3a5a1de0bc4d36ad87003b49844ccfa0714531fb',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '37',
      pageUrl: 'https://unsplash.com/photos/erTjj730fMk',
      author: 'Austin Neill',
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
      assetId: 'cover.story.bulk.0083.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0083.2026-08-23.jpg',
      checksum:
        'sha256:3bc8fbc8ecd178531c1980cde8e2169c9838733df315b502efbfb031dc2f6b7a',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '36',
      pageUrl: 'https://unsplash.com/photos/osSryggkso4',
      author: 'Vadim Sherbakov',
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
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0087.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0087.2026-08-23.jpg',
      checksum:
        'sha256:d8df92abca2d8a979de547ce5d701f716314ad39c28513d17d10f254a6a020ce',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '155',
      pageUrl: 'https://unsplash.com/photos/4f7r1LuPYj8',
      author: 'Christopher Sardegna',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0089.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0089.2026-08-23.jpg',
      checksum:
        'sha256:6e13df37766e3241152a20b62715aae0975598be4dbc4078d31c6a41e1d369ca',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '169',
      pageUrl: 'https://unsplash.com/photos/BjelfpszQDw',
      author: 'Noel Lopez',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0091.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0091.2026-08-23.jpg',
      checksum:
        'sha256:2978e18844e4122e76f085f747edcd4e7e35fed8c0e07f7fe7fcb0bfcb89d55e',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '46',
      pageUrl: 'https://unsplash.com/photos/Nzw3HHsNHYU',
      author: 'Jeffrey Kam',
    },
  },
  {
    storyId: 'story.bulk.0092',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0092.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0092.2026-08-23.jpg',
      checksum:
        'sha256:ba939f0faf7c0d564960bbb857fc2d5597ff916fa2b033d2ad3f820f5a3a657e',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '3394668',
      pageUrl: 'https://www.pexels.com/photo/woman-with-headphones-3394668/',
    },
  },
  {
    storyId: 'story.bulk.0093',
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0093.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0093.2026-08-23.jpg',
      checksum:
        'sha256:356e49b12bce1a3ac1c8574b20e84e12a87b754659b3f9c1206ee523ba00ccca',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '100',
      pageUrl: 'https://unsplash.com/photos/pwaaqfoMibI',
      author: 'Tina Rataj',
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
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0095.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0095.2026-08-23.jpg',
      checksum:
        'sha256:92ee3c3560ab7047b6a2bc28956915e8b8c103c18ff91da9c4fdeb9cb56374aa',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '31258513',
      pageUrl:
        'https://www.pexels.com/photo/urban-scene-man-walking-with-phone-in-hand-31258513/',
    },
  },
  {
    storyId: 'story.bulk.0096',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0096.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0096.2026-08-23.jpg',
      checksum:
        'sha256:5a597336d5a5810f9dec968ad64aa34bbcb64fc1d606e55e9cc231fa1cc74556',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '36764927',
      pageUrl:
        'https://www.pexels.com/photo/woman-painting-in-art-studio-with-natural-light-36764927/',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0099.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0099.2026-08-23.jpg',
      checksum:
        'sha256:b23a0dc54512839f871135ca2367669e289a56599615534093ef9efdc0eaaebd',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '103',
      pageUrl: 'https://unsplash.com/photos/DwTZwZYi9Ww',
      author: 'Ilham Rahmansyah',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0103.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0103.2026-08-23.jpg',
      checksum:
        'sha256:97234ee131ca8ccdad5edd5094eb2aa9ad6d8307b6e402dafff8140790b878e7',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '189',
      pageUrl: 'https://unsplash.com/photos/pHM4a_RZSLE',
      author: 'Buzo Jesús',
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
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0109.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0109.2026-08-23.jpg',
      checksum:
        'sha256:456d044ab94a8cfe6946f51456e1705215a084efac643985e02ad18be0693b67',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '17803626',
      pageUrl:
        'https://www.pexels.com/photo/man-walking-on-street-in-town-17803626/',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0111.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0111.2026-08-23.jpg',
      checksum:
        'sha256:a2be8ecc6794bcb78fc7dac0ad388f89bbe32927de7a83b17fd6dd28f13fc9e7',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '41',
      pageUrl: 'https://unsplash.com/photos/fTKetYpEKNQ',
      author: 'Nithya Ramanujam',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0113.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0113.2026-08-23.jpg',
      checksum:
        'sha256:f8c388459f8ea84aa0c6a333e676cbf1b6b566ea2561f551d7becc6af402ae14',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '117',
      pageUrl: 'https://unsplash.com/photos/Q14J2k8VE3U',
      author: 'Daniel Ebersole',
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
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0115.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0115.2026-08-23.jpg',
      checksum:
        'sha256:7d02e09e34ef1fec3c8fb06bb81d273480a7bed02bd86ec3a745345c18ca9c47',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '182',
      pageUrl: 'https://unsplash.com/photos/BwgKUh9tN84',
      author: 'Andrea Boldizsar',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0117.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0117.2026-08-23.jpg',
      checksum:
        'sha256:b4f269f733064527e61f7a7ad010bfbfb35c9eeb2e2ff61844fdee44f833fa69',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '219',
      pageUrl: 'https://unsplash.com/photos/7iB4OZDlRok',
      author: 'Martyn Seddon',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0119.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0119.2026-08-23.jpg',
      checksum:
        'sha256:356c0bb206c172bf31406729527fc92fe08c3f352c56e2333c5d53156b3d7db1',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '62',
      pageUrl: 'https://unsplash.com/photos/PzPbh-faPgU',
      author: 'Daniel Genser',
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
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0121.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0121.2026-08-23.jpg',
      checksum:
        'sha256:fff82bc1ee667ec98bc805e1694138c1b752520ebe31a5e9b19db4386bcaabfe',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '122',
      pageUrl: 'https://unsplash.com/photos/xS_RzdD5CFE',
      author: 'Vadim Sherbakov',
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
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0129.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0129.2026-08-23.jpg',
      checksum:
        'sha256:6c277e12d010e91b93973d10d7ea49143f14bd0aba008f641e5a32756f345a7b',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '183',
      pageUrl: 'https://unsplash.com/photos/k7bQqdUf954',
      author: 'müllermarc',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0131.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0131.2026-08-23.jpg',
      checksum:
        'sha256:e9cb015022d2c0aaf590dc8625bd4a9335d5a5ee8562a71fabefcaab2b4b8362',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '237',
      pageUrl: 'https://unsplash.com/photos/8wTPqxlnKM4',
      author: 'André Spieker',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0133.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0133.2026-08-23.jpg',
      checksum:
        'sha256:1a437bd42d50cbe751b1be88d8e9dbe0f33dd8cf12f06e8f4043b12fbac2d9e6',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '74',
      pageUrl: 'https://unsplash.com/photos/YhZbnxqtooM',
      author: 'Isaak Dury',
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
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0137.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0137.2026-08-23.jpg',
      checksum:
        'sha256:96ba7eaff986d41dfe9f5fbd7ff81cb35837ec49958e2b089ecabbc2b89115bd',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '1467477',
      pageUrl:
        'https://www.pexels.com/photo/man-walking-near-man-standing-1467477/',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0139.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0139.2026-08-23.jpg',
      checksum:
        'sha256:53ce272f684d0975aad46c20a538fc7f3f392429edf218ebd900a4a563eafd68',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '73',
      pageUrl: 'https://unsplash.com/photos/umLpP7uCZs0',
      author: 'Jon Eckert',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0141.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0141.2026-08-23.jpg',
      checksum:
        'sha256:237761210d164db1c6a92828c1a63b1ef953c1002d48734aead189591dd0e896',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '158',
      pageUrl: 'https://unsplash.com/photos/MRxD-J9-4ps',
      author: 'Daniel Robert',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0145.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0145.2026-08-23.jpg',
      checksum:
        'sha256:3aac7b9c4eec5c5b5e399489e264c643e8643b805351294890dab1dc35e14c84',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '239',
      pageUrl: 'https://unsplash.com/photos/GyvMk5pPDXI',
      author: 'Coley Christine',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0147.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0147.2026-08-23.jpg',
      checksum:
        'sha256:a5e6c0ddc57fae374d88c337973e6bd519225668964f9092fd4935afcb75032f',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '77',
      pageUrl: 'https://unsplash.com/photos/j9nfqTi5T5o',
      author: 'May Pamintuan',
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
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0149.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0149.2026-08-23.jpg',
      checksum:
        'sha256:432b59a9b428756e5bfac5f68806e732547467666838e10e8bc2527ae4ec6d9c',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '142',
      pageUrl: 'https://unsplash.com/photos/KSyemQIWwP8',
      author: 'Vadim Sherbakov',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0153.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0153.2026-08-23.jpg',
      checksum:
        'sha256:79f47af2695056ad27a4d9e8e916959a1c2f3eb1f996432c763eb27f92a4efde',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '75',
      pageUrl: 'https://unsplash.com/photos/1gBUXhf0PtA',
      author: 'Jassy Onyae',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0155.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0155.2026-08-23.jpg',
      checksum:
        'sha256:ddb4fa4680af0a73d1c570a03a86e71e64c59933338c8968509c5ad276f951b0',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '173',
      pageUrl: 'https://unsplash.com/photos/J8k-gzI0Zy0',
      author: 'Linh Nguyen',
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
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0157.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0157.2026-08-23.jpg',
      checksum:
        'sha256:1f10608229a73e1a1347e758e461e6d253d72a80cd3da7eaa5cba4358d8c442b',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '220',
      pageUrl: 'https://unsplash.com/photos/qUToqliACNA',
      author: 'Robin Röcker',
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
    category: 'nature',
    asset: {
      assetId: 'cover.story.bulk.0159.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0159.2026-08-23.jpg',
      checksum:
        'sha256:892a6e268ab52b7b0584d9efe35a8843cc0c138d3f378e9fffac425d43fc9963',
      width: 1024,
      height: 1024,
      altText: 'Деталь природы крупным планом.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '244',
      pageUrl: 'https://unsplash.com/photos/Y-eIZ3g8_ko',
      author: 'Yair Hazout',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0161.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0161.2026-08-23.jpg',
      checksum:
        'sha256:e0e038dc56f95f42aa8bf3a7274d6e9f8069d3cdf82dd7b273baf4115468a024',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '83',
      pageUrl: 'https://unsplash.com/photos/dYshDcTI1Js',
      author: 'Julie Geiger',
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
    category: 'man',
    asset: {
      assetId: 'cover.story.bulk.0165.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0165.2026-08-23.jpg',
      checksum:
        'sha256:be3969d057a41ca64864434c79912555f31f3a6dabd8f904a9c7cb30fde2ab6a',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет мужчины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '21235178',
      pageUrl: 'https://www.pexels.com/photo/man-walking-on-sidewalk-21235178/',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0167.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0167.2026-08-23.jpg',
      checksum:
        'sha256:393b936fcc32f20abb5426396ebda7ecb2e36695bac05d85700da75f33442dea',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '96',
      pageUrl: 'https://unsplash.com/photos/CuFYW1c97w8',
      author: 'Pawel Kadysz',
    },
  },
  {
    storyId: 'story.bulk.0168',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0168.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0168.2026-08-23.jpg',
      checksum:
        'sha256:1e929193d545d6528a0adbc5a5f23d0fb150a3d478332d235ab355125bccf963',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '20772448',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-smiling-women-20772448/',
    },
  },
  {
    storyId: 'story.bulk.0169',
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0169.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0169.2026-08-23.jpg',
      checksum:
        'sha256:3fffabae211ce2924250d0280f424e247eaab9585af24192b872e69fe6e0a9da',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '177',
      pageUrl: 'https://unsplash.com/photos/tvicgTdh7Fg',
      author: 'Danka & Peter',
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
    category: 'vehicle',
    asset: {
      assetId: 'cover.story.bulk.0171.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0171.2026-08-23.jpg',
      checksum:
        'sha256:2cb1af6fe2e65fdaa17d8be492f3e2a23edf5e5e1b50f3c2de3486658ac59a91',
      width: 1024,
      height: 1024,
      altText: 'Транспорт в городской сцене.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '263',
      pageUrl: 'https://unsplash.com/photos/NUBjCmEgbHM',
      author: 'Kristian Karlsson',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0173.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0173.2026-08-23.jpg',
      checksum:
        'sha256:cac31eef971dae53ecba3c83dee92847edc5ec2d2572739aa3bdf7594ea5d77d',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '110',
      pageUrl: 'https://unsplash.com/photos/D76DklsG-5U',
      author: 'Kenneth Thewissen',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0177.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0177.2026-08-23.jpg',
      checksum:
        'sha256:9e1bd0fa3c4bb6ac9b2b83fd0d2349786f3cf96df57fa9b87870b4db3ddd1e61',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '102',
      pageUrl: 'https://unsplash.com/photos/pJILiyPdrXI',
      author: 'Ben Moore',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0179.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0179.2026-08-23.jpg',
      checksum:
        'sha256:16d837d79a1f2cce2ce21c0492bf590d8f1267da8552582e6cc2ea85212e2ceb',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '203',
      pageUrl: 'https://unsplash.com/photos/PFZTiiJnjag',
      author: 'Diogo Tavares',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0181.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0181.2026-08-23.jpg',
      checksum:
        'sha256:fb2b83d4353bc6d61792209a543c6721cc1a5ab2f6bc49a925d33823757dadf2',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '124',
      pageUrl: 'https://unsplash.com/photos/fj0tFloTPGQ',
      author: 'Anton Sulsky',
    },
  },
  {
    storyId: 'story.bulk.0182',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0182.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0182.2026-08-23.jpg',
      checksum:
        'sha256:110e8b430ca9452ecf27ae0173cf3f535148b224ac5283f1c2fc63d6eca8dc68',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '36653213',
      pageUrl:
        'https://www.pexels.com/photo/portrait-of-smiling-woman-holding-book-36653213/',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0185.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0185.2026-08-23.jpg',
      checksum:
        'sha256:61ecf07cd9623ed5f2650a91a42532be6418987b5f8c0bdfb6c08553c4835e09',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '104',
      pageUrl: 'https://unsplash.com/photos/2fl-ocJ5MOA',
      author: 'Dyaa Eldin',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0187.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0187.2026-08-23.jpg',
      checksum:
        'sha256:df5987aa2d278e5087e2fa6ed11a49aeac81107fa1f5feb531ba68e6e468cd8c',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '211',
      pageUrl: 'https://unsplash.com/photos/GDvSktiPIQQ',
      author: 'Martin Wessely',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0189.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0189.2026-08-23.jpg',
      checksum:
        'sha256:986cd29c4993d453cb7d930674be61f1a39dffc6dc26ab54cd82289e01f2091b',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '127',
      pageUrl: 'https://unsplash.com/photos/rf-0DQu5M6Y',
      author: 'Marcin Czerwinski',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0197.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0197.2026-08-23.jpg',
      checksum:
        'sha256:343346051fbcc36d09b53e557e90482bad0c1d5f34c9b913aa626929b5fe50be',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '128',
      pageUrl: 'https://unsplash.com/photos/hlnucYOsL-c',
      author: 'Matteo Minelli',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0201.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0201.2026-08-23.jpg',
      checksum:
        'sha256:497d8efb58c508f0d5650ff9cab6aa106561adf16e1ae5d389bc0af1f3671a9e',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '139',
      pageUrl: 'https://unsplash.com/photos/M-1MRfncLk0',
      author: 'Steve Richey',
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
    category: 'scene',
    asset: {
      assetId: 'cover.story.bulk.0203.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0203.2026-08-23.jpg',
      checksum:
        'sha256:ecc47e2586392d21dde8990942a92c9a5c2c6fe1d1cdeec96f9d27058d40d702',
      width: 1024,
      height: 1024,
      altText: 'Повседневная городская сцена.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '281',
      pageUrl: 'https://unsplash.com/photos/_poRbNNfcE8',
      author: 'Victor Erixon',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0205.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0205.2026-08-23.jpg',
      checksum:
        'sha256:3b3830b15e99a0d05d068316a3654c8b29875e9c581e48fcb0b46a20403389aa',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '176',
      pageUrl: 'https://unsplash.com/photos/WO4bxwzHRe8',
      author: 'Good Free Photos',
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
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0207.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0207.2026-08-23.jpg',
      checksum:
        'sha256:ee57498dab61f4dc5edf65ffde8dba0ae373c3958861abc5eebebc3c0242cafa',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '221',
      pageUrl: 'https://unsplash.com/photos/7UzYfAXUgI8',
      author: 'Todd Quackenbush',
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
    category: 'landscape',
    asset: {
      assetId: 'cover.story.bulk.0211.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0211.2026-08-23.jpg',
      checksum:
        'sha256:83539c4d6b5e66759b4d03e2be725a1f0167b3f68e6aad4cc5c959e681992a4c',
      width: 1024,
      height: 1024,
      altText: 'Природный пейзаж.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '231',
      pageUrl: 'https://unsplash.com/photos/XeCvtUX-AE0',
      author: 'Aleksandra Boguslawska',
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
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0213.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0213.2026-08-23.jpg',
      checksum:
        'sha256:73f9ec26aae45d510413e5fc7f14c5b40f171dcdd8bcea95e622c753db0424d6',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '234',
      pageUrl: 'https://unsplash.com/photos/_py5wlZTI2c',
      author: 'Laura Liberal',
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
      assetId: 'cover.story.bulk.0215.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0215.2026-08-23.jpg',
      checksum:
        'sha256:439d5302cc050dabb43e090fe60c82e42d5322eb532a672cb3be68366e7df23a',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '157',
      pageUrl: 'https://unsplash.com/photos/HFbRnCjWHsk',
      author: 'koichi nakajima',
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
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0217.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0217.2026-08-23.jpg',
      checksum:
        'sha256:5f6396cd11ca7bda51fede58af5c943b4d5064899079e8473f9da2b8feae307d',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '249',
      pageUrl: 'https://unsplash.com/photos/nrLtvA05jk8',
      author: 'Anders Jildén',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0219.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0219.2026-08-23.jpg',
      checksum:
        'sha256:9bd1e935ae450197c6a5c5893705f0ee6a862f112c3b874b36b8ce15a51cd2a5',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '160',
      pageUrl: 'https://unsplash.com/photos/Zdcq3iKly6g',
      author: 'Thom',
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
    category: 'building',
    asset: {
      assetId: 'cover.story.bulk.0225.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0225.2026-08-23.jpg',
      checksum:
        'sha256:285b8a4a6299c3b15ea7d9450d17643abbef7dc722ac15f627d3590cee716e74',
      width: 1024,
      height: 1024,
      altText: 'Городское здание.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '283',
      pageUrl: 'https://unsplash.com/photos/GtxZbYMCiPY',
      author: 'Wojtek Witkowski',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0227.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0227.2026-08-23.jpg',
      checksum:
        'sha256:bfddcca2f1fb063cdc072451c30206f39d0e25e089785a3aa4518b1552d1fad5',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '201',
      pageUrl: 'https://unsplash.com/photos/YoadQb46v6k',
      author: 'Craig Garner',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0231.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0231.2026-08-23.jpg',
      checksum:
        'sha256:bcbb5fab43643fc56910cb4fd69e38e15d4c472a60f51adad4530549133e7647',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '225',
      pageUrl: 'https://unsplash.com/photos/hGO27G5tZJ8',
      author: 'Vee O',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0233.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0233.2026-08-23.jpg',
      checksum:
        'sha256:94694d3dafdefa45f3cf7aabf2b71c582e3b54269c497bfadb3f90708952d9ae',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '292',
      pageUrl: 'https://unsplash.com/photos/hv1MrBzGGNY',
      author: 'Webvilla',
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
    category: 'object',
    asset: {
      assetId: 'cover.story.bulk.0235.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0235.2026-08-23.jpg',
      checksum:
        'sha256:17ad30871d34f55629d317e5bbc97f4065ce0614448c5c145c6f051c0e3684dc',
      width: 1024,
      height: 1024,
      altText: 'Предмет повседневного обихода.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Unsplash',
      sourceId: '312',
      pageUrl: 'https://unsplash.com/photos/RQHzRELE2Ss',
      author: 'Sonja Langford',
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
      assetId: 'cover.story.bulk.0238.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0238.2026-08-23.jpg',
      checksum:
        'sha256:f55425cca8b7542cddd4179b49f2e78c5016825e6e6983f45de0cf3c68ef832b',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '8740338',
      pageUrl:
        'https://www.pexels.com/photo/a-beautiful-woman-in-a-black-shirt-8740338/',
    },
  },
  {
    storyId: 'story.bulk.0239',
    category: 'woman',
    asset: {
      assetId: 'cover.story.bulk.0239.2026-08-23',
      kind: 'cover',
      path: 'story-previews/story.bulk.0239.2026-08-23.jpg',
      checksum:
        'sha256:87b2dab436bdb372d6f60ec20495252d49f0775e0154339a5c78dcf79552f967',
      width: 1024,
      height: 1024,
      altText: 'Фотографический портрет женщины.',
      provenance: 'licensed',
    },
    source: {
      provider: 'Pexels',
      sourceId: '32049231',
      pageUrl:
        'https://www.pexels.com/photo/smiling-woman-relaxing-indoors-in-warm-light-32049231/',
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

export const storyPreviewAssetIdFor = (storyId: string): string => {
  const definition = storyPreviewDefinitionFor(storyId)
  if (!definition) {
    throw new Error(`Missing story preview definition for ${storyId}`)
  }
  return definition.asset.assetId
}

export const storyPreviewAssetsFor = (
  storyIds: readonly string[],
): ContentAsset[] =>
  storyIds.flatMap(storyId => {
    const definition = storyPreviewDefinitionFor(storyId)
    return definition ? [definition.asset] : []
  })
