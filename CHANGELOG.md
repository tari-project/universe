🚀 TARI UNIVERSE v1.2.16: The Season of Light: Part 2

_July 2, 2025_

Hey everyone,

Tari contributors are excited to unveil Tari Universe v1.2.16 "The Season of Light Part 2." This release builds on the success of the first Season of Light release last week, which meaningfully improved both the conversion rate for new users and overall retention rate by over 20%. This release features significant changes to the UI for Tari Universe to better communicate when you should expect your first rewards, and how long it will take to see your wallet balance. It also has more under the hood updates to improve overall sync ability and reduce the potential for errors. We can't wait to hear what you think about Season of Light Part 2!

✨ WHAT'S NEW

- ⏰ **Clear Timing** – We now tell you how long to expect for three key milestones:
   - A. CPU rewards
   - B. GPU mining activation
   - C. wallet balance updates
- 🎉 **Victory Celebrations** – Many miners are winning but had no idea! We've completely revamped the winning experience to make your victories more fun and enjoyable
- 🎛️ **Streamlined Controls** – The Start, Stop, and Power Level buttons have been polished and refined for a smoother, more intuitive mining experience
- 🔧 **Under-the-Hood Improvements** – Various bug fixes and optimizations to further improve the stability of Tari Universe, and reduce the potential for errors

---

🚀 TARI UNIVERSE v1.2.14: The Season of Light

_June 27, 2025_

Hey everyone,

Tari contributors are proud to introduce Tari Universe v1.2.14, the first release in the "The Season of Light" series. "The Season of Light" releases are focused on one goal: make Tari Universe work well on as many computers as possible. Our first release in this series makes significant headway on this front by eliminating several root causes for the dreaded "node setup failure" timeout and sync challenges. We can't wait to hear your thoughts on the first Season of Light release!

✨ WHAT'S NEW
- 🔄 **Sync Reliability** – The setup process sometimes prematurely gives up ("node setup failed" error) on slower connections, whereas now it will continue if it detects that progress is still being made
- ⚡ **Installing Dependencies** – Previously, set-up failures sometimes occurred if too many miners attempted to update all at once, such as during an automatic update. We also fixed a bug that was impacting the downloading of Tor
- 🌉 **Bridge Timeouts** – We've fixed the issue where Tari Universe was overwhelming the bridge with excessive requests, causing timeouts
- 🔑 **Seed Word Import** – We've fixed the issue where seed word imports were failing for some users
- ⚙️ **Your Power Settings Stay Put** – As many of you reported, switching between Eco, Ludicrous, and Custom mining modes would reset your carefully chosen power level settings. Your preferences now stick
- 🖥️ **Port Settings** - For more technical users who want to see how things work under the hood, we've exposed the gRPC port numbers in Settings

---

🚀 TARI UNIVERSE v1.2.12: The Bloom Beyond

_June 18, 2025_

Hey everyone,

Welcome to "The Bloom Beyond" release of Tari Universe. This release adds some finishing touches to yesterday's CEXy Mining-focused release. We hope you are all enjoying lots of CEXy Mining out there in the Tari Universe!

✨ WHAT'S NEW

- 💰 Mining Rewards Display – Mining Rewards in progress no longer flicker between address balances when you change your wallet address. Pool tooltips show up when you hover over them.
- ⚙️ Exchange Settings – Your exchange preferences are saved properly and won't reset when you restart the app.
- 💼 Wallet Interface – We've heard from many of you that the wallet felt clunky and hard to navigate. We've streamlined the interface so you can find what you need faster.
- 🌍 Bridge Languages – The bridge now works in 12 languages, like the rest of Tari Universe, so you can use Tari Universe in your native language!
- 🔧 Core Updates – No more losing track of your payment references! We've fixed an issue where your payment reference information would disappear during blockchain syncs

🐞 KNOWN ISSUES

- We know some of you are still experiencing setup and chain sync failures. Contributors are working on fixes coming soon.
- The Tari bridge sometimes becomes unresponsive. A fix is in the works.

---

🚀 TARI UNIVERSE v1.2.10: The Eternal Bloom

_June 17, 2025_

Hey everyone,

Tari contributors have been working behind the scenes with Centralized Exchanges (CEXs) on a breakthrough new type of collaboration 💪🚀 

Today, when CEXs list a project, there is a standard playbook involving trading competitions, AMAs etc. These elements are a great way for active CEX users to learn about new projects. What about legacy CEX users? Users that haven't logged in or traded in a while? How can we collaborate with CEXs to engage them? 

A plucky group of Tari contributors started thinking about this challenge and came up with a novel idea: what if you could enter a deposit wallet address from a supported exchange in Tari Universe, and mine directly to the CEX?

This way, ALL users from the exchange (active and legacy alike!) can generate new liquidity for themselves on the CEX without needing to deposit fiat. And the Tari network gains tons of new miners in the process. We call this idea: CEXy Mining (blame @fluffypony for the name :P), and it's live in Tari Universe v1.2.10 aka "The Eternal Bloom!" 

We're very lucky to have the support of forward thinking exchanges such as CoinEx, XT, and Biconomy. They are all launching support for CEXy Mining today!

Imagine if every exchange that chooses to list Tari becomes a part of the CEXy Mining program. Tens of millions of users (and perhaps hundreds of millions in future) will discover Tari, and many will start mining with Tari Universe!

PS: XT, Biconomy, and CoinEx are offering bonus XTM if you choose to use the CEXy Mining feature with them! The bonus program will occur in seasons, and today is the beginning of Season 1 🥳 

✨ How CEXy Mining Works

1. 💜🐢 Install Tari Universe 

2. 🤝 Connect Tari Universe to your desired CEX - Enter your Tari deposit address from your chosen exchange (Biconomy, XT, or CoinEx) 

3. 💎 Mine XTM and Earn Bonuses! – Start mining with Tari Universe! When you reach the bonus threshold for your chosen exchange, they'll reward you with bonus XTM 🙌

🐞 Known Issues (Fixes Coming Soon)

• If you switch back to your Tari Universe address after mining to an exchange, your Rewards in Progress may alternate between your Universe address and your Exchange address until you restart the application.

---

🚀 TARI UNIVERSE v1.2.9: Colonies of Light

_June 12, 2025_

Hey everyone,

Tari contributors continue to pull out all the stops to make Tari Universe the most beautiful and easiest-to-use crypto app in the world. Introducing the "Colonies of Light" release of Tari Universe, an awesome release filled to the brim with tweaks, bug fixes, and amazing updates

✨ What's New in "Colonies of Light"
- 🔗 **Link to Supported Exchanges**: We've introduced a new interface that makes it easy to see the list of CEXs that have listed XTM, and directly access them
- 💎 **Revamped Transaction History**: We've completely revamped the Tari Universe transaction history (!!!). Now your TX history will include your bridge transactions and better formatting. It's clean, clear, and far easier to use than ever before
- 🛡️ **Linux Tor Support**: We know the Tari Linux community will be hyped about this one: we've added missing library support for much smoother Linux installs
- ⏱️ **Smarter Download Handling**: Many of you have reported "node setup failure" errors when running Tari Universe. Our new download handling system should make these errors a thing of the past in MOST cases (not all.. but we're getting closer!). We can't wait to hear how this new system works for you
- ⚡ **Stability and Reliability Improvements**: For Tari Universe users on lower-end machines, Tari Universe should now be faster and more responsive for you
- 🔄 **Airdrop Game**: We fixed a bug where the Start/Stop mining button was getting stuck when logged into the Tari Airdrop Game

---

🚀 TARI UNIVERSE v1.2.8: The Feast of Light

_June 9, 2025_

🔄 Rolling out via auto-update

Hey everyone,

Introducing Tari Universe v1.2.8 "The Feast of Light." This release of Tari Universe adds an awesome new feature to the mix: now you can buy wXTM natively in Tari Universe with ETH, USDT, or USDC (!!!) 

✨ What's New in "The Feast of Light"
- 🌌 **Buy wXTM natively in Tari Universe**: Purchase wXTM directly using ETH, USDT, or USDC within the application
- 🔄 **Bridge Status View**: We've significantly improved status updates throughout the bridging journey

---

🚀 TARI UNIVERSE v1.2.7: The Crown of Every Heart

_June 5, 2025_

Hey everyone,

🎉 Tari Mainnet is nearly a month old! Tari Universe v1.2.7, also known as "The Crown of Every Heart," focuses on making the world's easiest-to-use crypto app smoother, faster, and more consistent. Our goal is for Tari Universe to become a "set it and forget" type of application. A well-oiled machine. With the release of "The Crown of Every Heart, we take a significant step together towards this goal!

✨ What's New  
- 🔡 **Improved message rendering**: Fixed garbled character issues when displaying messages from exchanges and third-party sources.  
- 🛡️ **Enhanced transaction error handling**: Clearer error messages for failed transactions and significantly reduced false "pending sends".  
- ⚡ **Faster balance updates**: Wallet balances now update in near real-time to reflect on-chain states.  
- 🔍 **Clearer transaction status display**: Transactions now clearly indicate whether they're pending, mined, confirmed, or completed—no more confusion around "Completed" meaning "still in mempool".

---

🚀 TARI UNIVERSE v1.2.6: The Second Song of Soon

_June 3, 2025_

Hey everyone,

This is the hotfix you've been looking for. Introducing the "Second Song of Soon." The first song was an "acquired taste" as folks in the music business would call it, but this song is a hit. This release should fix the network sync challenges many of you have been facing, including the dreaded "stuck at 3 of 5", mining orphan blocks, and wallet sync issues.

Note: Tari Universe will display the “3 / 5 Starting Minotari node” message for ~30 minutes the first time while it re-syncs the chain. Don’t worry, you will be CPU mining on Hatchling pool in the meantime!

---

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
