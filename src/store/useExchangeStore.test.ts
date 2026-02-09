import { describe, it, expect, beforeEach } from 'vitest';
import {
    useExchangeStore,
    universalExchangeMinerOption,
    setShowExchangeModal,
    setShowUniversalModal,
    setCurrentExchangeMinerId,
    setRewardData,
} from './useExchangeStore';

describe('useExchangeStore', () => {
    beforeEach(() => {
        useExchangeStore.setState({
            showExchangeAddressModal: null,
            showUniversalModal: null,
            currentExchangeMinerId: 'universal',
            reward_end_date: undefined,
            reward_earn_cap_percentage: undefined,
        });
    });

    describe('universalExchangeMinerOption constant', () => {
        it('has id as universal', () => {
            expect(universalExchangeMinerOption.id).toBe('universal');
        });

        it('has slug as universal', () => {
            expect(universalExchangeMinerOption.slug).toBe('universal');
        });

        it('has name as Tari Universe', () => {
            expect(universalExchangeMinerOption.name).toBe('Tari Universe');
        });

        it('has is_hidden as false', () => {
            expect(universalExchangeMinerOption.is_hidden).toBe(false);
        });

        it('has exchange_id as universal', () => {
            expect(universalExchangeMinerOption.exchange_id).toBe('universal');
        });

        it('has correct logo path', () => {
            expect(universalExchangeMinerOption.logo_img_small_url).toBe('/assets/img/tari_round.png');
        });

        it('has wxtm_mode as false', () => {
            expect(universalExchangeMinerOption.wxtm_mode).toBe(false);
        });
    });

    describe('initial state', () => {
        it('has showExchangeAddressModal as null', () => {
            expect(useExchangeStore.getState().showExchangeAddressModal).toBeNull();
        });

        it('has showUniversalModal as null', () => {
            expect(useExchangeStore.getState().showUniversalModal).toBeNull();
        });

        it('has currentExchangeMinerId as universal', () => {
            expect(useExchangeStore.getState().currentExchangeMinerId).toBe('universal');
        });

        it('has undefined reward_end_date', () => {
            expect(useExchangeStore.getState().reward_end_date).toBeUndefined();
        });

        it('has undefined reward_earn_cap_percentage', () => {
            expect(useExchangeStore.getState().reward_earn_cap_percentage).toBeUndefined();
        });
    });

    describe('setShowExchangeModal', () => {
        it('sets showExchangeAddressModal to true', () => {
            setShowExchangeModal(true);
            expect(useExchangeStore.getState().showExchangeAddressModal).toBe(true);
        });

        it('sets showExchangeAddressModal to false', () => {
            setShowExchangeModal(true);
            setShowExchangeModal(false);
            expect(useExchangeStore.getState().showExchangeAddressModal).toBe(false);
        });
    });

    describe('setShowUniversalModal', () => {
        it('sets showUniversalModal to true', () => {
            setShowUniversalModal(true);
            expect(useExchangeStore.getState().showUniversalModal).toBe(true);
        });

        it('sets showUniversalModal to false', () => {
            setShowUniversalModal(true);
            setShowUniversalModal(false);
            expect(useExchangeStore.getState().showUniversalModal).toBe(false);
        });
    });

    describe('setCurrentExchangeMinerId', () => {
        it('sets currentExchangeMinerId', () => {
            setCurrentExchangeMinerId('exchange-123');
            expect(useExchangeStore.getState().currentExchangeMinerId).toBe('exchange-123');
        });

        it('does not set if undefined', () => {
            setCurrentExchangeMinerId('exchange-123');
            setCurrentExchangeMinerId(undefined);
            expect(useExchangeStore.getState().currentExchangeMinerId).toBe('exchange-123');
        });

        it('does not set if empty string', () => {
            setCurrentExchangeMinerId('exchange-123');
            setCurrentExchangeMinerId('');
            expect(useExchangeStore.getState().currentExchangeMinerId).toBe('exchange-123');
        });

        it('can change between different exchanges', () => {
            setCurrentExchangeMinerId('exchange-1');
            expect(useExchangeStore.getState().currentExchangeMinerId).toBe('exchange-1');

            setCurrentExchangeMinerId('exchange-2');
            expect(useExchangeStore.getState().currentExchangeMinerId).toBe('exchange-2');
        });
    });

    describe('setRewardData', () => {
        it('sets reward_end_date', () => {
            setRewardData({ reward_end_date: '2024-12-31' });
            expect(useExchangeStore.getState().reward_end_date).toBe('2024-12-31');
        });

        it('sets reward_earn_cap_percentage', () => {
            setRewardData({ reward_earn_cap_percentage: 50 });
            expect(useExchangeStore.getState().reward_earn_cap_percentage).toBe(50);
        });

        it('sets both fields at once', () => {
            setRewardData({
                reward_end_date: '2025-06-30',
                reward_earn_cap_percentage: 75,
            });
            expect(useExchangeStore.getState().reward_end_date).toBe('2025-06-30');
            expect(useExchangeStore.getState().reward_earn_cap_percentage).toBe(75);
        });

        it('can clear reward data by setting undefined', () => {
            setRewardData({
                reward_end_date: '2024-12-31',
                reward_earn_cap_percentage: 50,
            });

            setRewardData({
                reward_end_date: undefined,
                reward_earn_cap_percentage: undefined,
            });

            expect(useExchangeStore.getState().reward_end_date).toBeUndefined();
            expect(useExchangeStore.getState().reward_earn_cap_percentage).toBeUndefined();
        });

        it('preserves other state', () => {
            setCurrentExchangeMinerId('test-exchange');
            setRewardData({ reward_end_date: '2024-12-31' });

            expect(useExchangeStore.getState().currentExchangeMinerId).toBe('test-exchange');
            expect(useExchangeStore.getState().reward_end_date).toBe('2024-12-31');
        });
    });

    describe('complex state updates', () => {
        it('preserves unrelated state when updating specific fields', () => {
            setCurrentExchangeMinerId('exchange-abc');
            setShowExchangeModal(true);

            expect(useExchangeStore.getState().currentExchangeMinerId).toBe('exchange-abc');
            expect(useExchangeStore.getState().showExchangeAddressModal).toBe(true);
        });

        it('full workflow simulation', () => {
            // User selects an exchange
            setCurrentExchangeMinerId('binance');
            expect(useExchangeStore.getState().currentExchangeMinerId).toBe('binance');

            // Exchange has reward data
            setRewardData({
                reward_end_date: '2024-12-31',
                reward_earn_cap_percentage: 100,
            });

            // User opens exchange modal
            setShowExchangeModal(true);
            expect(useExchangeStore.getState().showExchangeAddressModal).toBe(true);

            // User closes modal
            setShowExchangeModal(false);
            expect(useExchangeStore.getState().showExchangeAddressModal).toBe(false);

            // All other state preserved
            expect(useExchangeStore.getState().currentExchangeMinerId).toBe('binance');
            expect(useExchangeStore.getState().reward_end_date).toBe('2024-12-31');
        });
    });
});
