# todos [WIP]

collection of our todos in the codebase.
some are really old and irrelevant, will push a PR with the removals
will create sub issues for the rest

## frontend

| who            | what                                                                            |                                                                               where |      status      |
| :------------- | :------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------: | :--------------: |
| @peps          | // TODO add help link                                                           | `src/containers/floating/PaperWalletModal/sections/QRCodeSection/QRCodeSection.tsx` |                  |
| @Misieq01      | // todo move it to event                                                        |                                            `src/store/actions/setupStoreActions.ts` |                  |
| @Misieq01      | //TODO: replace with CpuMiningUnlocked and GpuMiningUnlocked from useSetupStore |                                                       `src/store/useMiningStore.ts` |                  |
| @mmrrnn        | // TODO: How should we validate the bridge? (IPv4, IPv6, different formats)     |    `src/containers/floating/Settings/sections/experimental/TorMarkup/TorMarkup.tsx` |                  |
| @shanimal08    | // TODO: revisit and make proper custom component for this                      |                                          `src/components/elements/ToggleSwitch.tsx` |                  |
| @shanimal08    | // TODO - make reusable address input                                           |                                      `src/components/exchanges/connect/Connect.tsx` |                  |
| @shanimal08    | // TODO: dedupe from block time/make reusable spaced counter?                   |                                        `src/components/mining/timer/MiningTime.tsx` |                  |
| @PanchoBubble  | // TODO - have these on config - Infura might be needed                         |                                                   `src/hooks/swap/lib/constants.ts` |                  |
| @stringhandler | // TODO: Prevent command execution + // TODO: Perhaps whitelist commands        |                                                         `dist-isolation/index.html` | resolved/removed |
| @shanimal08    | TODO: add the other sections if we want                                         |                                    `src/components/AdminUI/groups/OtherUIGroup.tsx` | resolved/removed |
| @shanimal08    | TODO: consider moving reference to dialog?                                      |                                    `src/components/AdminUI/groups/OtherUIGroup.tsx` | resolved/removed |
|                |                                                                                 |                                                                                     |                  |

## frontend

| who       | what                                                                                       |                                   where |                         status                         |
| :-------- | :----------------------------------------------------------------------------------------- | --------------------------------------: | :----------------------------------------------------: |
| 🤷🏻        | // TODO: Ensure we actually need this                                                      | `src-tauri/src/spend_wallet_adapter.rs` |                                                        |
| 🤷🏻        | // TODO: Check if this is correct                                                          | `src-tauri/src/spend_wallet_adapter.rs` |                                                        |
| 🤷🏻        | // TODO: Rename to ProcessInstance                                                         |      `src-tauri/src/process_adapter.rs` |                                                        |
| 🤷🏻        | //TODO: Do we still need this?                                                             |             `src-tauri/src/commands.rs` |                                                        |
| @brianp   | # TODO: Remove this before mainnet                                                         |                  `src-tauri/Cargo.toml` | should remove the todo only, i think it's still handy? |
| @Misieq01 | # needed for keymanager. TODO: Find a way of creating a keymanager without bundling sqlite |                  `src-tauri/Cargo.toml` |                                                        |
|           |                                                                                            |                                         |                                                        |
|           |                                                                                            |                                         |                                                        |
|           |                                                                                            |                                         |                                                        |
|           |                                                                                            |                                         |                                                        |
|           |                                                                                            |                                         |                                                        |
