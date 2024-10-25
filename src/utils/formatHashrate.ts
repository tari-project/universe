export function formatHashrate(hashrate: number, joinUnit = true): string {
    if (hashrate < 1000) {
        return joinUnit ? hashrate + ' H/s' : hashrate.toFixed(2);
    } else if (hashrate < 1000000) {
        return (hashrate / 1000).toFixed(2) + (joinUnit ? ' kH/s' : 'k');
    } else if (hashrate < 1000000000) {
        return (hashrate / 1000000).toFixed(2) + (joinUnit ? ' MH/s' : 'M');
    } else if (hashrate < 1000000000000) {
        return (hashrate / 1000000000).toFixed(2) + (joinUnit ? ' GH/s' : 'G');
    } else if (hashrate < 1000000000000000) {
        return (hashrate / 1000000000000).toFixed(2) + (joinUnit ? ' TH/s' : 'T');
    } else {
        return (hashrate / 1000000000000000).toFixed(2) + (joinUnit ? ' PH/s' : 'P');
    }
}
