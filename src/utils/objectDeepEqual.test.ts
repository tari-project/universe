import { describe, it, expect } from 'vitest';
import { deepEqual } from './objectDeepEqual';

describe('deepEqual', () => {
    describe('primitive values', () => {
        it('returns true for identical numbers', () => {
            expect(deepEqual(5, 5)).toBe(true);
        });

        it('returns false for different numbers', () => {
            expect(deepEqual(5, 10)).toBe(false);
        });

        it('returns true for identical strings', () => {
            expect(deepEqual('hello', 'hello')).toBe(true);
        });

        it('returns false for different strings', () => {
            expect(deepEqual('hello', 'world')).toBe(false);
        });

        it('returns true for identical booleans', () => {
            expect(deepEqual(true, true)).toBe(true);
            expect(deepEqual(false, false)).toBe(true);
        });

        it('returns false for different booleans', () => {
            expect(deepEqual(true, false)).toBe(false);
        });

        it('returns true for null === null', () => {
            expect(deepEqual(null, null)).toBe(true);
        });

        it('returns true for undefined === undefined', () => {
            expect(deepEqual(undefined, undefined)).toBe(true);
        });

        it('returns false for null vs undefined', () => {
            expect(deepEqual(null, undefined)).toBe(false);
        });
    });

    describe('type coercion', () => {
        it('returns false for number vs string with same value', () => {
            expect(deepEqual(5, '5')).toBe(false);
        });

        it('returns false for boolean vs number', () => {
            expect(deepEqual(true, 1)).toBe(false);
        });
    });

    describe('simple objects', () => {
        it('returns true for empty objects', () => {
            expect(deepEqual({}, {})).toBe(true);
        });

        it('returns true for identical flat objects', () => {
            expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
        });

        it('returns false for objects with different values', () => {
            expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
        });

        it('returns false for objects with different keys', () => {
            expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false);
        });

        it('returns false for objects with different number of keys', () => {
            expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        });

        it('returns true regardless of key order', () => {
            expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
        });
    });

    describe('nested objects', () => {
        it('returns true for identical nested objects', () => {
            expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
        });

        it('returns false for nested objects with different values', () => {
            expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
        });

        it('handles deeply nested structures', () => {
            const obj1 = { a: { b: { c: { d: 1 } } } };
            const obj2 = { a: { b: { c: { d: 1 } } } };
            expect(deepEqual(obj1, obj2)).toBe(true);
        });

        it('detects differences in deep structures', () => {
            const obj1 = { a: { b: { c: { d: 1 } } } };
            const obj2 = { a: { b: { c: { d: 2 } } } };
            expect(deepEqual(obj1, obj2)).toBe(false);
        });
    });

    describe('arrays', () => {
        it('returns true for empty arrays', () => {
            expect(deepEqual([], [])).toBe(true);
        });

        it('returns true for identical arrays', () => {
            expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
        });

        it('returns false for arrays with different values', () => {
            expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false);
        });

        it('returns false for arrays with different lengths', () => {
            expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
        });

        it('returns false for same elements in different order', () => {
            expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
        });

        it('handles nested arrays', () => {
            const arr1 = [
                [1, 2],
                [3, 4],
            ];
            const arr2 = [
                [1, 2],
                [3, 4],
            ];
            expect(deepEqual(arr1, arr2)).toBe(true);
        });
    });

    describe('mixed structures', () => {
        it('handles objects containing arrays', () => {
            expect(deepEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
        });

        it('handles arrays containing objects', () => {
            expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
        });

        it('handles complex mixed structures', () => {
            const obj1 = {
                name: 'test',
                values: [1, 2, 3],
                nested: { deep: { arr: [{ x: 1 }] } },
            };
            const obj2 = {
                name: 'test',
                values: [1, 2, 3],
                nested: { deep: { arr: [{ x: 1 }] } },
            };
            expect(deepEqual(obj1, obj2)).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('returns false when comparing object to null', () => {
            expect(deepEqual({ a: 1 }, null)).toBe(false);
        });

        it('treats arrays and objects with same keys/values as equal (known behavior)', () => {
            // Note: This is the actual behavior of deepEqual - it compares by keys
            expect(deepEqual([1, 2], { 0: 1, 1: 2 })).toBe(true);
        });

        it('handles objects with undefined values', () => {
            expect(deepEqual({ a: undefined }, { a: undefined })).toBe(true);
        });

        it('distinguishes undefined value from missing key', () => {
            expect(deepEqual({ a: undefined }, {})).toBe(false);
        });
    });

    describe('same reference', () => {
        it('returns true for same object reference', () => {
            const obj = { a: 1 };
            expect(deepEqual(obj, obj)).toBe(true);
        });

        it('returns true for same array reference', () => {
            const arr = [1, 2, 3];
            expect(deepEqual(arr, arr)).toBe(true);
        });
    });
});
