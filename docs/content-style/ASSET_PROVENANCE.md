# Asset provenance

Every shipped asset lists source, generation/editing method, digest, review status, and allowed surfaces. Repository owner is the rights custodian for original code-generated brand/audio work. Generated portraits remain fixture material until creative and legal acceptance is recorded.

## Brand and interface assets

| Path                                   | Method                                                | SHA-256                                                            | Review / allowed use                |
| -------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| `apps/mobile/assets/brand-mark.svg`    | Original repo-native vector construction              | `f7b9e0f1abd43cc987f8c968f754de3a5108b26169a1d12cc6b6981b9d885149` | Brand review pending; internal/beta |
| `apps/mobile/assets/icon.png`          | User-supplied artwork with AI-assisted edge extension | `4c9587cfa5fc1933a6bd9fe991b440b6ec259755bfa150e0ecb7f93d1e0ce766` | Store/brand review pending          |
| `apps/mobile/assets/adaptive-icon.png` | 432 px Android derivative of the icon master          | `d78f7fd60abc421e8f7b98b474cd479ccb71bf090b198a6b0c66576ae83a9b3d` | Store/brand review pending          |
| `apps/mobile/assets/splash-icon.png`   | Rounded 512 px splash derivative of the icon master   | `e2170191d505895d40647284c0ecc9312bcb4f09aa7637218bd68ac146a3fca8` | Store/brand review pending          |
| `apps/mobile/assets/favicon.png`       | 64 px web derivative of the icon master               | `c3fdd3c0cdddb21766824d66920eaa53646d3b78cc454cdf7519fddb4b93b59c` | Internal web QA                     |

## Development portraits

Originally generated 2026-08-13 and 2026-08-15, then regenerated 2026-08-24 with the built-in workspace image-generation tool as original fictional characters. The 2026-08-24 pass preserves each character's established identity while replacing severe expressions and dark backdrops with restrained warmth, softer natural light, open shadows, and subtle analog grain. No text, logo, celebrity, or real-person reference was used.

| Character / path            | Prompt-specific direction                                                                                              | SHA-256                                                            | Review / allowed use                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Ира — `portraits/ira.png`   | Short tousled dark bob and black turtleneck; calm direct gaze; warm cream and muted ember backdrop                     | `e1e69a72f0c1d7351d9eb6e6adf571031b7f682861140144f822e91d47745fbc` | Creative/legal review pending; fixture and beta only |
| Ася — `portraits/asya.png`  | Sleek dark bob, dark blazer, and light knit top; attentive restrained warmth; cream and muted ochre backdrop           | `15c797c9c3aa48f59863abb0318f3b1b20701938b4c28aed6d13d92485d276b0` | Creative/legal review pending; fixture and beta only |
| Дина — `portraits/dina.png` | Low dark ponytail, practical jacket, and headphones; grounded receptive expression; warm stone and muted plum backdrop | `23149991a0f62f5e520cb1a328f3c79bcbdac79eb8897ac855175e79fa5b8ded` | Creative/legal review pending; fixture and beta only |
| Вера — `portraits/vera.png` | Short auburn curls, dark green jacket, and cream shirt; understated closed-mouth warmth; cream and moss backdrop       | `3b16997f02265b4ed10e3a869fa23a4998d9ea00053ef0ab5dcdebf209603138` | Creative/legal review pending; fixture and beta only |

No portrait represents or implies a real person's likeness. The content manifest marks these assets `generated-fixture`, so the production publication gate rejects them.

## Story preview covers

The bundled catalog uses 243 story-specific licensed photographs. No photograph
or normalized output is reused. The mix is intentionally women-led without
turning the catalog into a wall of landscapes: 191 women-led photographs, 8
men-led photographs, 14 buildings, 3 vehicles, 12 everyday objects, 8 everyday
scenes, 4 interiors, and 3 landscapes.

The auditable record is
`packages/test-fixtures/src/story-previews.generated.ts`. Every entry contains
the story ID, immutable cover asset ID and path, exact source page, provider
source ID, category, normalized SHA-256 digest, and author where the upstream
catalog exposes one. Pexels sources use the
[Pexels license](https://www.pexels.com/license/); Unsplash sources use the
[Unsplash license](https://unsplash.com/license).

All source files were visually curated, square-cropped with attention-aware
positioning, resized to 1024×1024, encoded as progressive JPEG at quality 82,
and stripped of embedded metadata. On 2026-08-24 every cover was checked against
its title and premise; 79 definite mismatches and 21 weak or overly generic fits
were replaced with new licensed sources keyed to visible story cues such as
letters, archives, keys, maps, recordings, cameras, transit, windows, posters,
lockers, receipts, and snow.
The replaced assets received new immutable IDs while the 2026-08-23 files remain
available for older exact builds. The resulting assets are allowed on story
catalog cards and other story-preview surfaces. They do not replace character
identity portraits on profile or detail surfaces, and their use does not imply
endorsement by any depicted person.

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
