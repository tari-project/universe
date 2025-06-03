🚀 TARI UNIVERSE v1.2.2: The Song of Soon

_June 2, 2025_

Hey everyone,

As we approach week 4 of mainnet, Tari contributors are excited to share a new release of Tari Universe: v1.2.2, aka "The Song of Soon." This release focuses on maintenance, bug fixes, and enhancing the quality of life for all Tari Universe users. Thank you for your continuous feedback. Our goal is to make Tari Universe the world's best and easiest-to-use crypto app.

✨What's New: Desktop
• New animations to celebrate your pool wins
• UI cleanup and front-end performance improvements (removing bloat)
• GPU mining no longer requires a manual restart after loading
• Mac OS Keychain no longer prompts unnecessarily
• Fixed front-end memory leak
• Added translations (more coming)
• Fix for buttons requiring double clicks to toggle
• White screen (of death) fix on linux 🙌
• Base node update (low-level enhancements will reduce memory usage)

🐞 Known Issues (Fixes Coming Soon):
• 📱 Mobile Wallet – Some users are experiencing sync issues, disappearing transactions, and problems with exchange payment IDs
• 🌉 wXTM Bridge – Known issues include transactions stuck on pending, unclear failure states, and slow performance
• 🔗 Network Sync – Users may get stuck at "Setting up Tari Node 3/5" or see incorrect block heights
• ⚖️ Wallet Balance – Balance sync and transaction state feedback are being overhauled for accuracy and reliability

---

🚀 TARI UNIVERSE v1.2.0: The Flourishing

_May 28, 2025_

Hey everyone,

Welcome to Tari Universe v1.2.0 - "The Flourishing"! Contributors are thrilled to deliver powerful new features designed to expand the Tari Universe and create new opportunities for the Tari community:

🌉 New Features:
• Bridge XTM → wXTM NOW directly on Ethereum Mainnet via Metamask.
• Swap Ethereum & ETH tokens → wXTM COMING SOON natively within the Tari Universe.

These features mark an exciting step towards integrating Tari with broader blockchain ecosystems.

⚠️ Important Notes:
• MVP Release: Currently a one-way bridge (XTM → wXTM only). The two-way bridge (wXTM → XTM) is scheduled for release around July 2025.
• Transaction Cap: Transactions are initially capped at 100,000 XTM for security purposes. Transactions exceeding this amount will fail. There is no limit to the number of transactions you can do.  This cap will increase and eventually be removed as the feature matures.
• Potential Bugs: Extensive QA testing has been conducted, but given the variety of community system configurations, you might encounter unforeseen issues. Please report bugs you encounter here: https://forms.gle/n8MVwLRrL9m6G7w39 so contributors can help!

🔖 Official wXTM Contract Address:
• Contract Address: `0xfD36fA88bb3feA8D1264fc89d70723b6a2B56958`
• Controller: `0x6c6f5B091bc50a6cB62e55B5c1EB7455205d2880`
• Bridge: `0xb72FD42A94a360587dCe790947e18A2CbcD4BC65`

A community-led liquidity pool has been seeded on Uniswap, but you are free to use your wXTM tokens with any Ethereum-compatible tool you prefer. Future deployments of wXTM across multiple chains will leverage LayerZero OFTs, enabling seamless cross-chain transfers.

🔍 Smart Contract Audit Report:
We want to thank the team at Coinspect for auditing the wXTM smart contract. You can view their audit report here: https://www.coinspect.com/doc/Coinspect%20-%20Smart%20Contract%20Audit%20-%20Tari%20-%20wXTM%20Bridge%20-%20Fix%20Review%20-%20v250528.pdf

🐞 Known Issues (Fixes Coming Soon):
• Metamask on iOS + Mac OSX combination for Tari Universe Swap: This combination of products doesn't work properly yet. It does work with other iOS based Ethereum wallets
• GPU Mining: Might require manual restart after sync completion
• Mac OS Keychain Prompts: Multiple prompts may appear during wallet updates. Choosing "Always Allow" resolves this issue
• Translations: Bridge feature translations are currently missing but will be added ASAP
• Display/UI Artifacts: Minor visual design errors present

---

🚀 TARI UNIVERSE v1.1.1 (HARD FORK): The Flow Supreme

_May 26, 2025_

Hey everyone!
Welcome to Tari Mainnet Week 3! Today, we're thrilled to launch "The Flow Supreme", an essential upgrade designed to supercharge mining rewards across a diverse range of hardware.

What's New?

✅ Network Hard Fork Complete
The Tari network has successfully forked as of block 15,000. Here's how the hash is now distributed:

- 33% RandomX (Merged mining with XMR)
- 33% RandomX (Solo mining for Tari)
- 33% SHA3

This means ~240 new blocks per day—an entirely fresh lane for miners to win Tari rewards!

✅ Tari Universe, now with "Hatchling" pool baked in

We've integrated a centralized, low-fee (1% for infra costs) mining (Hatchling!) pool specifically optimized for the Tari RandomX solo mining lane. This new pool ensures a steadier, more predictable flow of rewards for CPU miners with diverse hardware configurations, all while we continue refining the decentralized p2pool experience.

- Optional: You can still choose solo mining if that's your preference!
- CPU only: GPU miners will keep hashing directly via the native Tari p2pool.

⚠️ Known Issues (to be addressed in upcoming hotfix)
- GPU Mining: GPU mining may not start automatically. If this happens, you'll need to stop and then start mining for it to work *after* sync completes
- Mac OS Keychain Prompts: On Mac, you'll be asked for your Keychain password many times when Universe updates the wallet. Selecting Always Allow will solve this issue

Expect a hot fix soon that solves both of them.

Thank you for being here and believing in Tari. You are Tari. We are ALL Tari 💜🐢

---

🚀 TARI UNIVERSE v1.0.12: The Shell Eternal

_May 26, 2025_

Hey everyone,
In preparation for the hard fork at block 15,000 today, contributors have prepared one more hotfix: "The Shell Eternal." Please update Tari Universe to this new version ASAP to help prepare the network for the hard fork. Thank you for being Tari OGs! 💜🐢

---

🚀 TARI UNIVERSE v1.0.11: The Shell Ascendant

_May 25, 2025_

Hey everyone,
Welcome to Day 19 of Tari mainnet! The "Shell Ascendant" hotfix prepares the network for the hard fork at block 15,000, happening ~ mid-late afternoon on Monday 26th UTC. A reminder of how the Tari network is changing:

Currently, the Tari network hash rate is split as follows:
- 50% RandomX (merge mine with XMR)
- 50% SHA3

After the hard fork, the network hash rate will be split as follows:
- 33% RandomX (merge with XMR)
- 33% RandomX (Tari solo mine)
- 33% SHA3

The goal is to create a new opportunity for Tari-focused miners to earn more rewards. All miners must upgrade their mining client to continue mining after the hard fork. If you don't, you'll be mining air 😛

---

🚀 TARI UNIVERSE v1.0.10: Waves of Resolve

_May 15, 2025_

Hey everyone,
Happy day 9 of Tari mainnet! The “Waves of Resolve” hotfix improves p2pool stability and networking reliability. P2pool ftw! 💜🐢

✨ WHAT’S NEW
- Reduces unnecessary resyncs to the p2pool share chain
- Fixes a bug where large messages in p2pool sent over the network were getting cut off because they were too big, which negatively impacted synching to the tip of the p2pool share chain

---

🚀 TARI UNIVERSE v1.0.0: A Boundless Paradise

_May 6, 2025_

Hey Everyone,

The day is finally here. After 2,863 days of hard work (!!!), the Tari mainnet is LIVE. Thank you for believing in us. For your passion. Late night bug reports. And brilliant ideas for making Tari Universe even better. Tari exists because of you 💜🐢
The birth of a proof-of-work network is special. In the early days, the network needs time to stabilize and find its rhythm. We call this the “warm-up phase.”

Contributors and early supporters of the Tari network (like exchanges and infrastructure partners) expect the warm-up phase to last about 15 days. After that, the network will transition to a more stable state.
During the warm-up phase, some quirks are normal. You might see block time fluctuations, temporary disconnections, syncing delays, or even short-lived forks that require your node to reconnect to the main chain.
The warm-up phase is a great time to mine because rewards are highest per block. We hope the early days of the Tari network are rewarding for you.

Let the games begin. May the blocks be forever in your favor!
