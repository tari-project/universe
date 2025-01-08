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
