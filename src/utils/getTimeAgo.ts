export function timeAgo(timestamp = 0) {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const secondsAgo = now - timestamp;

    if (secondsAgo < 60) {
        return `${secondsAgo} secs ago`;
    } else if (secondsAgo < 3600) {
        const minutesAgo = Math.floor(secondsAgo / 60);
        return `${minutesAgo} min${minutesAgo !== 1 ? 's' : ''} ago`;
    } else if (secondsAgo < 86400) {
        const hoursAgo = Math.floor(secondsAgo / 3600);
        return `${hoursAgo} hr${hoursAgo !== 1 ? 's' : ''} ago`;
    } else {
        const daysAgo = Math.floor(secondsAgo / 86400);
        return `${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
    }
}
