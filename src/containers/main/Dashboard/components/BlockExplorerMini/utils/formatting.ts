export const timeAgo = (timestamp: number): string => {
    const now = Date.now();
    const timeInMilliseconds = new Date(timestamp * 1000).getTime();
    const difference = now - timeInMilliseconds;

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''}`;
    return `${seconds} sec${seconds > 1 ? 's' : ''}`;
};

export const formatReward = (number: number): string => {
    if (number >= 1_000_000_000) {
        return `${(number / 1_000_000_000).toFixed(1)}B`;
    } else if (number >= 1_000_000) {
        return `${(number / 1_000_000).toFixed(1)}M`;
    } else if (number >= 100_000) {
        return `${(number / 1_000).toFixed(1)}K`;
    } else {
        return number.toLocaleString('en-US');
    }
};

export const formatBlockNumber = (number: string): string => {
    if (number.length > 3) {
        return number.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    }
    return number;
};
