export default function calculateTimeSince(earlier: number, later: number) {
    const past: Date = new Date(earlier * 1000); // Convert seconds to milliseconds
    const diff: number = later - past.getTime();

    // Convert the difference to days, hours, minutes, and seconds
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const daysString = days > 0 ? `${days} day${days === 1 ? '' : 's'}, ` : '';
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const hoursString = hours.toString().padStart(2, '0');
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        .toString()
        .padStart(2, '0');
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        .toString()
        .padStart(2, '0');

    return {
        days,
        daysString,
        hours,
        minutes,
        seconds,
        hoursString,
    };
}
