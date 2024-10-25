export function formatHashrate(hashrate: number, joinUnit = true): string {
    let formattedHashrate = '';
    if (hashrate < 1000) {
        formattedHashrate = hashrate.toFixed(2);
    } else if (hashrate < 1000000) {
        formattedHashrate = (hashrate / 1000).toFixed(2) + ' k';
    } else if (hashrate < 1000000000) {
        formattedHashrate = (hashrate / 1000000).toFixed(2) + ' M';
    } else if (hashrate < 1000000000000) {
        formattedHashrate = (hashrate / 1000000000).toFixed(2) + ' G';
    } else if (hashrate < 1000000000000000) {
        formattedHashrate = (hashrate / 1000000000000).toFixed(2) + ' T';
    } else {
        formattedHashrate = (hashrate / 1000000000000000).toFixed(2) + ' P';
    }
    return joinUnit ? formattedHashrate + 'H/s' : formattedHashrate;
}
