export default function formatBalance(balance: number) {
    const formattedBalance = balance / 1_000_000;
    const truncate = (num: number, digits: number) => {
        const factor = Math.pow(10, digits);
        return Math.floor(num * factor) / factor;
    };

    if (formattedBalance >= 1000) {
        return truncate(formattedBalance, 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    } else if (formattedBalance >= 1) {
        return truncate(formattedBalance, 2).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    } else {
        return truncate(formattedBalance, 3).toLocaleString(undefined, {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
        });
    }
}
