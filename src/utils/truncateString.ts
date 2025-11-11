import emojiRegex from 'emoji-regex';

const truncateString = (str: string, num: number): string => {
    if (str.length <= num) return str;
    return str.slice(0, num) + '...';
};

const truncateMiddle = (str: string, num: number, separator = '...'): string => {
    if (str.length <= num) return str;
    let end = str.substring(str.length - num);
    let start = str.substring(0, num);

    const regex = emojiRegex(); // in case it's AN EMOJI ADDRESS
    const matches = str.match(regex);

    if (matches) {
        end = matches?.slice(matches.length - num).join('');
        start = matches?.slice(0, num).join('');
    }

    return start + separator + end;
};

export { truncateMiddle, truncateString };
