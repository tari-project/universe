export function formatDateForEvent(date: Date) {
    // Array of day abbreviations
    const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];

    // Array of month abbreviations
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    console.log(date.getDay(), date.getMonth(), date.getDate());

    // Get day, month, date
    console.log(date, date.getDay(), date.getMonth(), date.getDate());
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dateNum = date.getDate();

    // Get hour in 12-hour format
    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    // Format everything together
    return `${dayName}, ${monthName} ${dateNum} @${hours}${ampm} EST`;
}
