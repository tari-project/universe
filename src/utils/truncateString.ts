const truncateString = (str: string, num: number): string => {
    if (str.length <= num) return str;
    return str.slice(0, num) + '...';
};

const truncateMiddle = (str: string, num: number): string => {
    if (str.length <= num) return str;
    const end = str.substring(str.length - num);
    const start = str.substring(0, num);

    return start + '...' + end;
};

export { truncateMiddle, truncateString };
