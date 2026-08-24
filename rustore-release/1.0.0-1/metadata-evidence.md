# RuStore metadata evidence

| Claim | Reachable UI | Implementation path | Android support | Limitation | Confidence |
| --- | --- | --- | --- | --- | --- |
| Exactly four available replies | Reader response tray | `RunScreen` → `resolveDecision` | React Native Android screen | Disabled only while a commit is in flight | High |
| A reply changes state, reaction, and next scene | Reader choice | `commitChoice` → `applyChoice` → `applyEffects` | Durable repository uses the native SQLite store | Consequences depend on authored content | High |
| Progress survives relaunch and resumes | Story card, Continue section, Archive | `DurableAppRepository` → `SqliteSnapshotStore.transact` | `repository.native.ts` selects Expo SQLite | Same-device persistence; no cloud claim | High |
| Installed stories remain readable offline | Catalog and story details | Bundled content loader → native package store | Bundled packages are seeded and read locally | Remote discoveries must first be installed | High |
| Recaps, archive, and spoiler-safe branch maps | Recap, Archive, Branches | Run events and frozen transcript → recap/archive/fork workflows | All screens are registered mobile routes | Branches can start only from authored save points | High |
| Search and catalog filters | Stories tab and filter sheet | `StoriesScreen` → `queryCatalogStories` | Shared React Native UI | Filters reflect available catalog metadata | High |
| Content warnings and safe routes | Story details and Content Controls | Warning selection → `createRun({ safeRouteWarningId })` | Shared React Native UI and durable state | A safe route appears only when authored | High |
| Reading appearance and accessibility settings | Settings, Appearance, Text Size | `updateSettings` → durable repository | Shared React Native UI | Large choices may scroll vertically | High |
| Weekend reading reminders | Settings notification section | Reminder scheduler → native notification gateway | Android channel and local scheduled notifications | Requires OS permission and user opt-in | High |
| Export and deletion controls | Settings | JSON serializer/share sheet and `deleteAllLocalData` | React Native Share and native persistence clear | Export uses the device share sheet | High |

Evidence was taken from executable source and Android/native adapters at commit `405574c1bad30e12ddb7d50e607b34eaf0cead5a`; product prose documents were not used for claims.
