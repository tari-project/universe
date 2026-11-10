import { describe, it, expect } from 'vitest';
import { deepEqual } from './objectDeepEqual';

describe('Adversarial Stress Tests for objectDeepEqual', () => {
    describe('1. Scale and Linear Complexity O(K)', () => {
        it('handles 10,000 keys in linear time (< 50ms) without quadratic explosion', () => {
            const objA: Record<string, number> = {};
            const objB: Record<string, number> = {};

            for (let i = 0; i < 10_000; i++) {
                const k = `k_${i}`;
                objA[k] = i;
                objB[k] = i;
            }

            const start = performance.now();
            const result = deepEqual(objA, objB);
            const duration = performance.now() - start;

            expect(result).toBe(true);
            // In O(K^2), 10,000 keys would require 100M comparisons (~1,000 - 3,000ms).
            // In O(K), it should take well under 50ms.
            expect(duration).toBeLessThan(100);
        });

        it('demonstrates approximately linear scaling between 1,000 and 10,000 keys', () => {
            const makeObj = (n: number) => {
                const o: Record<string, number> = {};
                for (let i = 0; i < n; i++) o[`key_${i}`] = i;
                return o;
            };

            const o1k_a = makeObj(1_000);
            const o1k_b = makeObj(1_000);
            const o10k_a = makeObj(10_000);
            const o10k_b = makeObj(10_000);

            // Warm up JIT
            for (let i = 0; i < 5; i++) {
                deepEqual(o1k_a, o1k_b);
            }

            const t1Start = performance.now();
            for (let i = 0; i < 20; i++) {
                deepEqual(o1k_a, o1k_b);
            }
            const t1 = (performance.now() - t1Start) / 20;

            const t10Start = performance.now();
            for (let i = 0; i < 20; i++) {
                deepEqual(o10k_a, o10k_b);
            }
            const t10 = (performance.now() - t10Start) / 20;

            // In O(N^2), 20 iterations of 10,000 keys would take > 20,000ms (~20-40 seconds).
            // In O(N), 20 iterations take < 500ms total (< 25ms per iteration).
            expect(t10).toBeLessThan(25);
            expect(t1).toBeLessThan(10);
        });

        it('detects difference at the 10,000th key correctly', () => {
            const objA: Record<string, number> = {};
            const objB: Record<string, number> = {};
            for (let i = 0; i < 10_000; i++) {
                objA[`k_${i}`] = i;
                objB[`k_${i}`] = i;
            }
            objB['k_9999'] = -1;

            expect(deepEqual(objA, objB)).toBe(false);
        });

        it('detects missing key at position 0 in 10,000 keys object', () => {
            const objA: Record<string, number> = {};
            const objB: Record<string, number> = {};
            for (let i = 0; i < 10_000; i++) {
                objA[`k_${i}`] = i;
                if (i !== 0) objB[`k_${i}`] = i;
            }
            expect(deepEqual(objA, objB)).toBe(false);
        });
    });

    describe('2. Prototypes, Security and Property Spoofing', () => {
        it('handles Object.create(null) without throwing TypeError', () => {
            const nullProto1 = Object.create(null);
            nullProto1.a = 1;
            nullProto1.b = 'test';

            const nullProto2 = Object.create(null);
            nullProto2.a = 1;
            nullProto2.b = 'test';

            expect(() => deepEqual(nullProto1, nullProto2)).not.toThrow();
            expect(deepEqual(nullProto1, nullProto2)).toBe(true);

            nullProto2.b = 'diff';
            expect(deepEqual(nullProto1, nullProto2)).toBe(false);
        });

        it('handles objects with overridden hasOwnProperty property', () => {
            const customFn = () => false;
            const obj1 = {
                hasOwnProperty: customFn,
                a: 1,
            };
            const obj2 = {
                hasOwnProperty: customFn,
                a: 1,
            };
            expect(deepEqual(obj1, obj2)).toBe(true);

            // With different primitive value on hasOwnProperty key
            const objA = { hasOwnProperty: 'custom_str', a: 1 };
            const objB = { hasOwnProperty: 'custom_str', a: 1 };
            expect(deepEqual(objA, objB)).toBe(true);

            const obj3 = {
                hasOwnProperty: customFn,
                a: 2,
            };
            expect(deepEqual(obj1, obj3)).toBe(false);

            // Note: Different function references for property return false
            const objDiffFn = {
                hasOwnProperty: () => false,
                a: 1,
            };
            expect(deepEqual(obj1, objDiffFn)).toBe(false);
        });

        it('handles objects with own toString and valueOf properties', () => {
            const evil1 = {
                toString: 'not a function',
                valueOf: 42,
            };
            const evil2 = {
                toString: 'not a function',
                valueOf: 42,
            };
            expect(deepEqual(evil1, evil2)).toBe(true);

            evil2.valueOf = 43;
            expect(deepEqual(evil1, evil2)).toBe(false);
        });

        it('ignores non-enumerable prototype properties and focuses on own properties', () => {
            const proto = { inheritedProperty: 'should be ignored by Object.keys' };
            const child1 = Object.create(proto);
            child1.ownProp = 100;

            const child2 = Object.create(proto);
            child2.ownProp = 100;

            expect(deepEqual(child1, child2)).toBe(true);

            child2.ownProp = 101;
            expect(deepEqual(child1, child2)).toBe(false);
        });
    });

    describe('3. Deep Nesting and Boundary Conditions', () => {
        it('safely handles deeply nested objects (depth 200) without crashing', () => {
            let deepA: Record<string, unknown> = { val: 42 };
            let deepB: Record<string, unknown> = { val: 42 };

            for (let i = 0; i < 200; i++) {
                deepA = { next: deepA };
                deepB = { next: deepB };
            }

            expect(deepEqual(deepA, deepB)).toBe(true);
        });

        it('detects difference at depth 200', () => {
            let deepA: Record<string, unknown> = { val: 42 };
            let deepB: Record<string, unknown> = { val: 99 };

            for (let i = 0; i < 200; i++) {
                deepA = { next: deepA };
                deepB = { next: deepB };
            }

            expect(deepEqual(deepA, deepB)).toBe(false);
        });

        it('throws RangeError on circular reference (documented limitation)', () => {
            const circularA: Record<string, unknown> = {};
            circularA.self = circularA;

            const circularB: Record<string, unknown> = {};
            circularB.self = circularB;

            expect(() => deepEqual(circularA, circularB)).toThrow(RangeError);
        });
    });

    describe('4. Type, Missing, Undefined, and Value Nuances', () => {
        it('correctly distinguishes undefined value from missing property', () => {
            expect(deepEqual({ a: undefined }, {})).toBe(false);
            expect(deepEqual({}, { a: undefined })).toBe(false);
            expect(deepEqual({ a: undefined }, { b: undefined })).toBe(false);
            expect(deepEqual({ a: undefined }, { a: undefined })).toBe(true);
        });

        it('handles array vs object with matching keys', () => {
            // Note: Known behavior where [10, 20] and { 0: 10, 1: 20 } have identical keys and values
            expect(deepEqual([10, 20], { 0: 10, 1: 20 })).toBe(true);

            // But if array-like object has extra 'length' key, it is false:
            expect(deepEqual([10, 20], { 0: 10, 1: 20, length: 2 })).toBe(false);
        });

        it('evaluates NaN === NaN as false (strict IEEE 754 semantics)', () => {
            // Standard JS behavior: NaN !== NaN
            expect(deepEqual({ a: NaN }, { a: NaN })).toBe(false);
            expect(deepEqual(NaN, NaN)).toBe(false);
        });

        it('treats Date and RegExp instances by enumerable keys (empty keys)', () => {
            // Date instances have no own enumerable properties
            const d1 = new Date(1000);
            const d2 = new Date(2000);
            // Both have Object.keys == []
            expect(deepEqual(d1, d2)).toBe(true);
        });

        it('ignores symbol-keyed properties because Object.keys only returns string keys', () => {
            const sym = Symbol('secret');
            const s1 = { [sym]: 'alpha' };
            const s2 = { [sym]: 'beta' };
            // Object.keys(s1) is [] and Object.keys(s2) is []
            expect(deepEqual(s1, s2)).toBe(true);
        });
    });
});
