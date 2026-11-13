const hasOwnProperty = Object.prototype.hasOwnProperty;

export function deepEqual(obj1: unknown, obj2: unknown): boolean {
    if (obj1 === obj2) return true;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    const record1 = obj1 as Record<string, unknown>;
    const record2 = obj2 as Record<string, unknown>;

    for (const key of keys1) {
        if (!hasOwnProperty.call(record2, key)) {
            return false;
        }

        const val1 = record1[key];
        const val2 = record2[key];

        if (val1 !== val2 && !deepEqual(val1, val2)) {
            return false;
        }
    }

    return true;
}
