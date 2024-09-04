const splitStringInHalf = (str: string): string => {
    const words = str.split(' ');
    const halfIndex = Math.ceil(words.length / 2);
    const firstHalf = words.slice(0, halfIndex).join(' ');
    const secondHalf = words.slice(halfIndex).join(' ');
    return firstHalf + '\n' + secondHalf;
};

const truncateString = (str: string, num: number): string => {
    if (str.length <= num) return str;
    return splitStringInHalf(str);
};

export default truncateString;
