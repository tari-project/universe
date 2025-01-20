# 🌟 TARI UNIVERSE v0.8.42: "The Shell of Fate, Part 3 (the end of the trilogy!)"

_January 14, 2025_

🔄 Rolling out over the next 24 hours

The Shell of Fate trilogy has been like one of those slow-burning TV series where you must wait patiently for each new season. Thankfully, we got to the end, and the ending here is far better than the end of Game of Thrones. Introducing Shell of Fate, Part 3: the alpha release of squads! In this version of Tari Universe, you will be randomly placed into a pool with a max size of 300 miners. There are no fancy graphics yet to tell you which pool you're in, but the idea is that by capping the # of miners per pool, we hope to create a world where every pool is a lot more stable and reliably produces rewards. Our goal is for 80%+ of Tari miners to earn rewards every single day. We can't wait to see how .42 works for you!

## 📊 WHAT'S NEW

Breakthroughs with p2pool! 

- ✨ 90% win rate
- 🔄 90% sync rate
- ⛓️ P2pool fork: upgrade required to continue earning tXTM and precious Gems
- 🔀 Pools are now sharded at 300 miners (alpha release of squads!)

## 🛠️ Stability Improvements

Contributors have been hard at work debugging and refactoring to make the app more stable. In today's release:

- 🚀 Resolved app freezing/unresponsiveness:
  - During startup
  - During window management
- 💰 Wallet updates partially fixed:
  - Note: Updates still take extended time

## ⚠️ Upcoming Fixes to Remaining Issues

- Re-enabling Window persistence/management 
- Animation sometimes freezes or doesn't play
- Speediness of transaction history display
- GPU support on Mac M series of processors
- Some GPUs are not detected
- Freezes and crashes on long-running sessions (you have to restart Universe occasionally)
- Freezes when trying to close Universe

Thank you for your continued support and feedback. Tari is coming SOON 💜🐢

---

# Tari Universe - Testnet v0.8.25

_December 17, 2024_

## 🎮 GPU Mining Enhancements

-   **Mac Optimization**  
    -   Resolved 60% nonce discard issue  
    -   Enhanced proof of work processing efficiency  
    -   Improved true hash rate efficiency by 60%

-   **OpenSSL Updates**  
    -   Enhanced GPU recognition system  
    -   Fixed M Mac-specific issues

## 🛠️ Platform Updates

-   **Framework Improvements**  
    -   Upgraded to Tauri V2  
    -   Enhanced backend library integration  
    -   Added opt-in alpha release channel in Settings  
    -   Reduced installation error rate by 30%

-   **UI Enhancements**  
    -   Improved p2pool statistics display  
    -   Resolved full-screen window issues  
    -   Added orphan chain fix suggestions

## ⚠️ Known Issues

-   P2pool optimization pending for low hash mining (<~1000 h/s CPU)
-   Latent shares may occur until next update
-   30-60 minute sync time with auto solo mining during sync
-   Intermittent hash power cycling
-   Minor window sizing issues persist

---

# Tari Universe - Testnet v0.8.7

_December 6, 2024_

## 🏊 P2Pool Improvements

-   **Major Optimization Updates**  
   -   Share interval increased to 20 seconds (up from 10s).  
   -   Enhanced share handling mechanisms.  
   -   Improved pool coalescence performance.  
   -   More equitable reward distribution system.

## 📊 Mining Statistics Enhancement

-   **New In-App Features**  
   -   Real-time p2pool tip distance monitoring.  
   -   Comprehensive mining history tracking:  
       -   Copyable mining history identifier.  
       -   Enhanced statistics visibility.

## 🌐 Network Stability Improvements

-   **Connection Optimization**  
   -   Enhanced TCP connectivity with IPv4/IPv6 DNS seed addresses.  
   -   Improved peer discovery mechanisms.  
   -   Faster network synchronization.

-   **Platform-Specific Fixes**  
   -   **Mac**: Optimized launch performance and shutdown times.  
   -   **Windows**: Resolved install location permissions and window management.

-   **Interface Updates**  
   -   Refined wallet and seed word styling.  
   -   Intelligent analytics permission handling.  
   -   Enhanced settings interface:  
       -   Copyable anonymous ID feature.  
       -   Persistent window position memory.  
   -   Integrated release notes viewer.

## ⚠️ Known Issues

-   P2pool optimization efforts are ongoing.
-   Initial synchronization delays may affect some users.

---

# Tari Universe - Testnet v0.8.5

_December 5, 2024_

## 📊 P2Pool Progress Updates

-   Achieving over 70% wins per day for networks with up to ~200 miners.
-   Consistent fragmentation issues arise beyond the ~200 miner threshold:
    -   Results in many orphan pools.
    -   Reduces overall p2pool performance.
-   Contributors are actively conducting behind-the-scenes diagnostics.
-   Stay tuned for updates throughout the week as we work toward a solution.

## 🛠 Universe Stability Improvements

-   **Network Connectivity**  
    -   Enhanced TCP connectivity using both IPv4 and IPv6 DNS seed addresses.  
    -   Improved connection stability.

-   **Platform-Specific Fixes**  
    -   **Mac**: Resolved app launch issues.  
    -   **Windows**: Fixed install location permissions.

-   **Interface Improvements**  
    -   Wallet and seed word styling enhancements.  
    -   Smarter analytics permission requests (no repeat prompts if already addressed).  
    -   General settings now include a copyable anonymous ID to explore your mining history easily.  
    -   Window position and size are now remembered across sessions.

-   **Performance**  
    -   Reduced long shutdown times.  
    -   Resolved exit errors.

---

# Tari Universe - Testnet v0.8.0: "The Shell’s Dominion"

_November 29, 2024_

## 🔄 Staged Rollout

-   Rolling out gradually to maintain network stability.

## 🆕 What's New

-   Major p2pool distribution improvements, fixing the "reorg" problem plaguing 0.7.x.
-   SHA3/GPU miner fixes.

### 📈 Early Results

-   70% of miners winning daily (!!!).  
-   Stable pool formation.  
-   More equitable reward distribution.

## ⚠️ Important Notes

-   Updates will arrive automatically based on the rollout phase.  
-   No action needed—just keep mining.  
-   Gem rebalancing will be rescheduled for Friday or Monday after the 0.8.x network stabilizes.
