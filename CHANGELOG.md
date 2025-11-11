🚀 TARI UNIVERSE v1.6.7: Seasons of Soon

_November 11, 2025_

🔄 Rolling out via auto-update

Hey Tari fam,

This release makes mining Tari more convenient than ever before! We've also fixed hashrate display issues, improved wallet balance updates, and improved handling of config files and error messages.

✨ WHAT'S NEW & FIXED

- 🔋 **Pause on battery mode** – Laptop users, this one's for you! Tari Universe now automatically pauses mining when you switch from being plugged in to battery, so you won't drain your laptop battery. As soon as you plug back in, mining resumes right where you left off. (Turn off in Settings)
- ⏰ **Schedule your mining** – Take complete control of when Tari Universe mines. Set a custom schedule (and mode!) e.g., every night ludicrous from 9 PM to 6 AM. Mine during off-peak hours or when you're not using your computer.
- 🪟 **System tray improvements** – You now have full control over how Tari Universe behaves when you close it. Choose to minimize to the system tray instead of fully exiting, keep mining in the background, and get a clear dialog explaining your options. On Windows, the taskbar icon now behaves like other tray apps for a cleaner experience.
- 📊 **Accurate hashrate display** – Your CPU mining hashrate was showing inflated numbers because we were accidentally adding rather than averaging. Now you'll see the real hashrate that matches what mining pools report.
- 💰 **Wallet balance updates instantly** – We've heard from many of you that available balance would get stuck at zero after sending transactions, sometimes for 40+ minutes.
- 🔐 **Better PIN error feedback** – When you enter an incorrect PIN during the "Sync with Phone" flow, you'll now see a clear error message instead of wondering what went wrong.

---

🚀 TARI UNIVERSE v1.6.3: The Invisible Garden

_October 13, 2025_

Hey everyone,

Following up on our previous update that made Universe less resource-intensive for lower-end laptops—resulting in a 30% increase in new miner retention—this release introduces a new low-power Eco mode and system tray experience that allows you to put mining in the background while you use your computer for other things! Plus we've packed in some thoughtful optimizations and polish that make everything smoother and smarter.

✨ WHAT'S NEW & FIXED

- **System tray mining control** – Clicking the close button now minimizes to system tray instead of shutting down. Control mining, check pool rewards, adjust settings, or fully exit, all from your taskbar. Open the app from the dock menu anytime.
- **Memory optimization** – CPU mining in Eco mode now uses XMRig's light mode, saving 2 GB of RAM.
- **Better stats display** – Kryptex pool stats now hide fields when data isn't available. Hashrate formatting improved with proper decimals for all ranges.
- **Reliability fixes** – Pool configuration updates work correctly again. Base node no longer advertises un-dialable TCP addresses. All mining processes properly terminate when shutting down.
- **Translation updates** – Updated all translations and added Brazilian Portuguese, bringing the total supported languages to 14! 🇧🇷

This release marks a major step forward in how you interact with Tari Universe throughout your day. Happy mining! 💜🐢

---

🚀 TARI UNIVERSE v1.6.2: The Luminous Threshold

_September 25, 2025_

Hey Tari fam,

This release is all about removing friction! We're making the first-time experience smoother for new users while fixing pain points that have been tripping up our veteran miners.

✨ WHAT'S FIXED

- **First-time experience** – GPU mining now automatically disables on systems with integrated graphics and less than 16 GB RAM to prevent performance issues. Advanced users can re-enable it in Settings if needed.
- **Pool options** – Added Kryptex to the list of available mining pools for more choice and flexibility.
- **GPU & antivirus** – Fixed pool switching issues and improved Windows Defender integration to prevent mining binaries from being flagged as false positives.
- **Wallet reliability** – Transaction history now loads properly after switching between local and remote nodes, plus better handling of long transaction descriptions and wallet resets.
- **Settings fixes** – Language dropdown now updates correctly when changed, exchange addresses save properly, and corrupted config files automatically recover.

---

🚀 TARI UNIVERSE v1.6.1: Hotfix — The Kingdom of All Waters Part 2

_September 18, 2025_

Hey Tari fam,

🐓 Following up on the workaround we shared before the hard fork at block 95,000: this hotfix resolves the C29 pool address bug. If you didn't manage to apply the workaround in time, no worries—LuckyPool temporarily redirected the SHA-3 pool to C29 so you didn't miss out. With this update, Tari Universe now automatically defaults to the correct C29 pool address.

✨ WHAT'S FIXED

- 🎯 **Correct C29 Pool Connection** – Tari Universe now automatically connects to the right Cuckaroo29 pool address without any manual setup needed.
- ⚡ **Faster GPU Switching** – When your GPU needs to switch miners, it now happens in 3 minutes instead of 30.
- 🔧 **Smarter GPU Management** – Better fallback logic means if one GPU miner isn't working, the app intelligently switches to the best alternative for your hardware.
- 🌐 **Pool Stats Fix** – Fixed the SHA-3x pool stats display so you can track your mining progress accurately.

---

🚀 TARI UNIVERSE v1.6.0: The Kingdom of All Waters

_September 15, 2025_

Hey Tari fam,

Introducing Tari Universe v1.6.0 "The Kingdom of All Waters." This release is a huge step forward for the Tari community: the Cuckaroo29 hard fork is nearly upon us! At block 95,000, Tari becomes the first blockchain with dedicated mining lanes for every type of mining hardware. No matter what you're running, there's a lane built for you.

This four-lane approach doesn't only make mining fairer, it makes the network incredibly secure by requiring attackers to control multiple mining hardware ecosystems simultaneously to successfully 51% attack the network.

🛣️ **Four Mining Lanes** – Every miner gets their own dedicated space:

- 🤝 **25% Tari RandomX merge-mining with Monero**
- ⚡ **25% Tari RandomX mining** for nearly any desktop or laptop hardware
- 🔧 **25% SHA-3x algorithm** for FPGA/ASIC miners (the "big" miners)
- 🎮 **NEW - 25% Cuckaroo29 (C29) algorithm** for ASIC-resistant GPU mining (for desktop GPU miners)

✨ WHAT'S NEW

- **C29 Support**: GPU mining defaults to C29 pool mining (LuckyPool) if your system can support it.

**Things to know:**
- C29 requires 7+ GB VRAM and measures performance in Graphs per second (G/s) rather than Hashes per second (H/s).
- It's memory-bound, so Tari Universe power levels won't have any effect (it's either on or off).
- Tari Universe automatically switches to SHA-3x pool mining for GPUs with less VRAM.
- Mac support for Cuckaroo29 mining coming in a future update

---

🚀 TARI UNIVERSE v1.5.17: Soon's Question

_September 9, 2025_

✨ WHAT'S NEW

- 📝 **Quick Exit Survey** – If you close the app, we'll ask a couple of quick questions to help us prioritize what to fix next.

---

🚀 TARI UNIVERSE v1.5.15: Hotfix — Tor Process Fix

_September 4, 2025_

🔄 Rolling out via auto-update

✨ WHAT'S FIXED

- 🔧 **Tor Process Cleanup** – Enhanced our cleanup routines to properly terminate Tor processes that were preventing local node updates and causing lingering version incompatibilities.

---

🚀 TARI UNIVERSE v1.5.14: The Season of Light — Part 8

_September 2, 2025_

✨ WHAT'S NEW

- 🔧 **Even Smarter Setup Process** – Completely redesigned setup with No Intro Screen and better error recovery. When things go wrong, you'll get clear options to restart individual components or send logs. The app can run with limited features if some modules fail (this was partially implemented in the previous release).
- ⚡ **New "Turbo" Mining Mode** – We've added a new 🌪️ Turbo mode between Eco and Ludicrous! Your old Eco setting (10%) is now Turbo, and the new Eco mode uses just 1% CPU for ultra-light mining by default. This eliminates an initial source of pain for users where Eco mode was too intense for lower-end machines.
- 🖥️ **Windows GPU Mining Fixes** – Enhanced support for tricky GPU setups with automatic driver detection, OpenCL package checking, and Windows Defender exclusions for mining files.
- 🌐 **Performance Boost** – Massive reduction in network calls to remote nodes (up to 99% fewer requests) for snappier performance and less server load.
- 🎨 **Polish & Fixes** – Better dark mode support, improved user avatars, fixed node switching issues. Note: We are aware of a UI issue with Remote + Local mode (falling back to Local when you are sync'd), which is that your sync progress is not displayed in the UI.
- 👉 **Base Node Update** – 5.0.0 fixes the recent spike in frag and prepares the network for Cuckaroo (C29), Along with many other under-the-hood improvements.

---

🚀 TARI UNIVERSE v1.5.12: The Season of Light — Part 7

_August 25, 2025_

✨ WHAT'S NEW

- 🚀 **Auto-update Fix** – We've completely redesigned how auto-updates work to eliminate the race condition that was causing the app to freeze right before restarting.
- ⚡ **Missing GPU crashes** – GPU miner files now only load when GPU detection is successful, preventing errors and improving startup reliability for all users. The app now gracefully handles systems without GPUs instead of crashing during startup.
- 💳 **Failed tx signing fix** – Fixed an issue where failed transaction signing on spend wallets would lock funds on view wallets. Now if signing fails, the transaction gets properly cancelled to prevent locked UTXOs.
- 🔧 **Wallet seed word fixes** – Seamless migration for wallet configurations when core address types change. Your existing wallet settings will automatically update to the new format without any action needed.
- 🌐 **Tor crashes** – Prevented unnecessary Tor startup on remote nodes, improving connection speed and reliability for users on remote configurations.
- ⬆️ **Core system upgrades** – Updated to Tari Core v5.0.0-pre.3 with improved stability and performance across all components.

---

🚀 TARI UNIVERSE v1.5.9: The Season of Light — Part 6½ Hotfix

_August 14, 2025_

Hey Tari OGs,

Quick hotfix coming your way! We've identified and fixed a GPU miner disconnection issue that was interrupting mining. Your GPUs should now stay connected and keep earning consistently.

---

🚀 TARI UNIVERSE v1.5.7: The Season of Light — Part 6

_August 12, 2025_

Hey everyone,

Introducing "Season of Light" Part 6 (we are getting to the end of this series.. we promise!). The goal for the Season of Light series is to make Tari Universe "just work" for as many users as possible. We've made a lot of progress with this release, thanks to all of the help and support of the Tari community. There's still more to do (we think Season of Light is Harry Potter film series in length…).

✨ WHAT'S NEW

- 🔄 **Improved pool mining** – RXT and SHA-3 mining now run on LuckyPool by default, with built-in support for multiple pools. You can choose your preferred pool via a new dropdown selector (all stratum pools are compatible; stats endpoints currently available for SupportXTM and LuckyPool).
   - Note: Your previous Hatchling rewards above 1 XTM will be paid out this week. 
- 💪 **Smarter error handling** – If a mining component runs into issues, the app will now automatically disable that component (local/GPU/CPU mining) and keep everything else running smoothly. Additional fallback systems are on the way.
- 🔔 **Streamlined security prompts** – Security notifications now appear in a less intrusive way without all the popups, so your mining flow stays uninterrupted.
- 🎬 **Animation improvements** – Win animations now handle block height changes without getting stuck.

---

🚀 TARI UNIVERSE v1.5.4: The Season of Light: Part 5

_August 1, 2025_

Hey everyone,

Introducing "Season of Light" Part 5: a follow-up release to Wednesday's huge update. We've been listening to your feedback and squashing bugs FAST. That's not all! Season of Light Part 5 includes a NEW seamless Gate.io integration that automatically converts your XTM to wXTM right into your exchange account. 

✨ WHAT'S NEW

- 🏦 Mine directly to your Gate account – You can now enter your Gate ETH mining address and have your XTM automatically wrapped to ETH and deposited directly into your exchange account! Your XTM gets wrapped once you reach the 8 XTM threshold (The bridge will start processing these transactions on Monday, every 6 hours)
- 🖥️ Improved GPU mining reliability – No more frustrating OpenCL library errors that prevented your GPU from mining! We've fixed compatibility issues and enhanced GPU detection, so your graphics card gets recognized.
- 💰 Wallet balance accuracy after imports – Fixed an issue where your wallet balance would show incorrectly for up to 30 seconds after importing or refreshing. Your balance now updates every 5 seconds for the first 2 minutes, ensuring you always see accurate amounts immediately.
- ↩️ Fixed send transaction workflow – No more getting stuck! We've fixed the issue where the "Review" button would become disabled if you went back to edit your send transaction details. You can now freely navigate between screens without losing your progress.
- 🌉 Bridge screen improvements – Removed distracting banner notifications that were covering important content when bridging funds.
- 💬 Enhanced transaction messages – You can now send transactions with empty messages without encountering errors. Sometimes you just want to send funds without adding a note.
- 📱 Fixed phone sync dialog – Resolved an issue where the sync-to-phone feature would cover the PIN entry dialog, preventing you from completing the sync process.
- ✨ Smoother wallet navigation – No more jarring blur effects when browsing your transaction history. 

---

🚀 TARI UNIVERSE v1.5.3: The Season of Light: Part 4

_July 30, 2025_

🔄 Rolling out via auto-update

Hey everyone,

Picture this: you download Tari Universe, and within a minute or two, you're earning XTM on both CPU AND GPU! No more waiting hours for sync, and no setup failures. Just pure, near-instant mining rewards!

✨ WHAT'S NEW

- ⚡ Near-instant GPU (SHA3) Mining – Instead of waiting for many minutes or hours to sync, your GPU will now mine to a community-supported pool FAST (nearly instantly!)
   -  You can toggle between Remote + Local (the default if you are upgrading), Remote only (default for new installs), or Local only
   -  You can disable pool mining which will fall back to solo mining (merge-mined RX, and SHA3)
- 🔧 Better GPU Miner – We've integrated a new community-supported GPU miner that's ~15% more efficient than before
- 💳 Faster Wallet Sync – Say goodbye to waiting hours! Since you don't have to wait for local node sync, your wallet transactions will show up faster (and your balance instantly)
- 🔐 Enhanced Security – Major upgrades to seed word handling to keep your XTM even safer
- 🛜 Massive Bandwidth Savings – Tari Universe will now use ~80% less bandwidth by default. This is a HUGE deal and one of our most requested improvements!
- 💾 Massive Disk Storage Savings – By default, Tari Universe will consume a lot less disk storage

---

🔥 HOTFIX v1.2.17: XMRig extraction bug on windows

_July 10, 2025_

Hey everyone,

We've received reports of a setup issue affecting some Windows machines, where XMRig initialization fails with the error "Failed to download xmrig: the file exists." XMRig is the component that enables your CPU to mine Tari using RandomX, so it's very important

This problem is an unexpected side effect of the improvements we shipped in yesterday's v1.2.16 release. It only affects the scenario where XMRig was unable to be fully updated on the first attempt. Contributors have identified the root cause and prepared a hotfix that should resolve the file extraction issue.

---

🚀 TARI UNIVERSE v1.2.16: The Season of Light: Part 3

_July 9, 2025_

Hey everyone,

Welcome everyone, to Tari Universe v1.2.16 aka "The Season of Light: Part 3!" This release of Tari Universe is a game-changer. It's filled to the brim with a ton of under-the-hood upgrades, tweaks, and improvements. It also introduces a brand new, groundbreaking feature: block bubbles!

Block bubbles are an entirely new way to experience Tari blocks. Every block is represented by a bubble in the Tari Universe (and Tari.com!) interface, including the XTM reward amount and the time it takes Tari miners to find the solution. When a block is solved, a lovely animation is played before the next block enters the Universe. It's fun, beautiful, and provides valuable information on what's happening with the Tari network block by block!

Let us know what you think about block bubbles. We hope you love them as much as Tari contributors do!

✨ WHAT'S NEW
- 🫧 **Block Bubbles** – A fun, beautiful, and invaluable real-time visualization of block production and XTM rewards
- 🎨 **Interface Polish** – We've moved the Send and Receive buttons to the filter row for a cleaner wallet layout. The Exchange button now smartly hides when you scroll through your transaction history, and your balance display shows "My Balance" when available. The Start Mining button now has better visual feedback between active and inactive states
- 🌉 **Transaction Organization** – Bridge transactions are no longer mixed up with mining Rewards. They now only show up in "Transactions" and "All Activity"
- 🔧 **System Reliability** – Improved file downloads that can now resume if interrupted, better Tor stability on Linux by using bundled libraries, better log file uploads, detailed database migration progress tracking, and fixed seed word restoration issues
- ⚙️ **Performance Updates** – Updated XMRig to version 6.24.0, fixed app unlock timing issues, and improved app restart handling
- 🏗️ **Under the Hood** – Enhanced network connectivity checking, better error handling for corrupted downloads, and improved request client architecture for more reliable operations

---

🚀 TARI UNIVERSE v1.2.15: The Season of Light: Part 2

_July 2, 2025_

Hey everyone,

Tari contributors are excited to unveil Tari Universe v1.2.15 "The Season of Light Part 2." This release builds on the success of the first Season of Light release last week, which meaningfully improved both the conversion rate for new users and overall retention rate by over 20%. This release features significant changes to the UI for Tari Universe to better communicate when you should expect your first rewards, and how long it will take to see your wallet balance. It also has more under the hood updates to improve overall sync ability and reduce the potential for errors. We can't wait to hear what you think about Season of Light Part 2!

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
