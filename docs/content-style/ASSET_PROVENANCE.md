# Asset provenance

Every shipped asset lists source, generation/editing method, digest, review status, and allowed surfaces. Repository owner is the rights custodian for original code-generated brand/audio work. Generated portraits remain fixture material until creative and legal acceptance is recorded.

## Brand and interface assets

| Path                                   | Method                                             | SHA-256                                                            | Review / allowed use                |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| `apps/mobile/assets/brand-mark.svg`    | Original repo-native vector construction           | `e330aebf8bda05c78b78af4ad71276fe756bcd4d68f55db3790c86d8f50fbff3` | Brand review pending; internal/beta |
| `apps/mobile/assets/icon.png`          | Rasterized original CharTalk glyph and color field | `49fe820ffd8f5a20a56f75a6a35dec8a5271fef38b853fe10fad71acfe0d731d` | Store/brand review pending          |
| `apps/mobile/assets/adaptive-icon.png` | Android adaptive rendering of the original glyph   | `4c40671f2bae3d2882c0932acdf3ce99b7b6866f94e9829effbc80980c196950` | Store/brand review pending          |
| `apps/mobile/assets/splash-icon.png`   | Splash rendering of the original glyph             | `168f1e5ff41076ea15390be23785e956612964c523b9e596ae2db90749349d81` | Store/brand review pending          |
| `apps/mobile/assets/favicon.png`       | Small raster rendering of the original glyph       | `3ee6ee72f369ee94a0f253788a0ecc552212aaad0c814d4a1a4ae603fc6bf9e1` | Internal web QA                     |

## Development portraits

Generated 2026-08-13 and 2026-08-15 with the workspace image-generation tool as original fictional characters. Shared direction: square editorial portrait, grounded contemporary Russian setting, soft natural light, subtle analog grain, no text, logo, celebrity, or real-person reference.

| Character / path            | Prompt-specific direction                                                                                                      | SHA-256                                                            | Review / allowed use                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Ира — `portraits/ira.png`   | Adult woman, observant museum conservator, dark bob, rust overshirt, quiet archive backdrop, ember accent                      | `b514f8bd9003cc79488bf563bf0d81e7b8fbb06f211a3577be42ec3ddcd16f06` | Creative/legal review pending; fixture and beta only |
| Ася — `portraits/asya.png`  | Adult woman, night-radio producer, wavy dark hair, headphones nearby, plum and rose studio light, direct restrained expression | `bdbdf62a649105a5ce8fc68f649ac70d8ad7532f9e40b6df629d5d1cf000f41c` | Creative/legal review pending; fixture and beta only |
| Дина — `portraits/dina.png` | Adult woman, field researcher, practical jacket, moss/ochre dusk landscape, alert understated expression                       | `a4d01d7e0cc65ee50c381ea083d67ac1b0ba9a430f6f0d893f1cf0d45a35392f` | Creative/legal review pending; fixture and beta only |
| Вера — `portraits/vera.png` | Adult woman, contemporary editor, short auburn curls, dark green jacket and cream shirt, moss/charcoal backdrop                | `e24cfbc0733bffbf248f95fa37c4bab6bd7bd53c75f8761ab655f763a53f524a` | Creative/legal review pending; fixture and beta only |

No portrait represents or implies a real person's likeness. The content manifest marks these assets `generated-fixture`, so the production publication gate rejects them.

## Story preview covers

The bundled catalog uses 243 story-specific licensed photographs. No photograph
or normalized output is reused. The mix is intentionally women-led without
turning the catalog into a wall of landscapes: 124 women portraits, 12 men
portraits, 22 buildings, 12 vehicles, 24 everyday objects, 16 everyday scenes,
5 interiors, 11 nature details, and 17 landscapes.

The auditable record is
`packages/test-fixtures/src/story-previews.generated.ts`. Every entry contains
the story ID, immutable cover asset ID and path, exact source page, provider
source ID, category, normalized SHA-256 digest, and author where the upstream
catalog exposes one. Pexels sources use the
[Pexels license](https://www.pexels.com/license/); Unsplash sources use the
[Unsplash license](https://unsplash.com/license).

All source files were visually curated, square-cropped with attention-aware
positioning, resized to 1024×1024, encoded as progressive JPEG at quality 82,
and stripped of embedded metadata on 2026-08-23. The resulting assets are
allowed on story catalog cards and other story-preview surfaces. They do not
replace character identity portraits on profile or detail surfaces, and their
use does not imply endorsement by any depicted person.

## Development attachment

The opening scene of the bundled sample story «После дедлайна» includes one
offline attachment so the reader path exercises the same immutable package
contract as text and portraits. It contains no readable text, logos, or
third-party material.

| Asset / path                                               | Prompt-specific direction                                                                                                        | SHA-256                                                            | Review / allowed use                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| `attachment.archive-note` — `attachments/archive-note.png` | Worn paper note, blue-ribbon key, and transit ticket on a dark wooden desk; warm late-evening light, moss/ochre/charcoal palette | `159e3626b8d140fb4f79b74bc060a137d863ff07473dc50387a77ada8481bddc` | Creative/legal review pending; fixture and beta only |

## Interface audio

The two cues are original PCM waveforms generated deterministically by `tooling/generate-ui-audio.mjs`; they contain no samples, voices, recordings, or third-party material.

| Path               | Construction                                                                 | SHA-256                                                            | Review / allowed use                         |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| `audio/choice.wav` | 70 ms, 44.1 kHz mono, 16-bit; 520/780 Hz sine partials with shaped fade      | `c357df25437b2af8c666c67e1e1579deb806d984c2212f2fbad3195836fd1a15` | Original; allowed after audio comfort review |
| `audio/commit.wav` | 110 ms, 44.1 kHz mono, 16-bit; 440/660/880 Hz sine partials with shaped fade | `fb472199a09f11ced18c315cd7632c1202edda1ce1164d174dc32caea15e7c32` | Original; allowed after audio comfort review |

Assets with unknown provenance fail the compiler. Any accepted production replacement receives a new asset ID, checksum, rights record, and human review evidence rather than silently replacing an immutable package asset.
