export default function formatBalance(value: number) {
    const balance = value / 1_000_000;
    const truncate = (num: number, digits: number) => {
        const factor = Math.pow(10, digits);
        return Math.floor(num * factor) / factor;
    };

    function replaceFn(str: string) {
        return str.replace(/,/g, '.');
    }

    if (balance >= 1_000_000) {
        const div = balance / 1_000_000;
        const truncatedStr = truncate(div, 3).toString();
        return replaceFn(`${truncatedStr}m`);
    }

    if (balance >= 10_000) {
        const div = balance / 1000;
        const truncatedStr = truncate(div, 2).toString();
        return replaceFn(`${truncatedStr}k`);
    }

    if (balance >= 1_000) {
        const div = balance / 100;
        const truncatedStr = truncate(div, 3).toString();
        return replaceFn(`${truncatedStr}k`);
    }

    if (balance > 0) {
        const truncatedStr = truncate(balance, 3).toString();
        return replaceFn(truncatedStr);
    } else {
        return replaceFn(balance.toPrecision(1));
    }
}
