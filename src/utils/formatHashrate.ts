export function formatHashrate(hashrate: number) {
    if (hashrate < 1000) {
        return hashrate + ' H/s';
    } else if (hashrate < 1000000) {
        return (hashrate / 1000).toFixed(2) + ' kH/s';
    } else if (hashrate < 1000000000) {
        return (hashrate / 1000000).toFixed(2) + ' MH/s';
    } else if (hashrate < 1000000000000) {
        return (hashrate / 1000000000).toFixed(2) + ' GH/s';
    } else if (hashrate < 1000000000000000) {
        return (hashrate / 1000000000000).toFixed(2) + ' TH/s';
    } else {
        return (hashrate / 1000000000000000).toFixed(2) + ' PH/s';
    }
}
