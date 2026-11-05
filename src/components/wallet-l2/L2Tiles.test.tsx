import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@app/test/test-utils';
import { initialState, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { handleL2NetworkStats } from '@app/store/actions/l2WalletStoreActions.ts';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import L2Tiles, { L2LaunchTile } from './L2Tiles';

const stats = {
    epoch: 11_432,
    block_height: 914_597,
    epoch_length: 80,
    blocks_into_epoch: 37,
    block_target_secs: 15,
    tx_count: 130_170,
    fee_volume: 869_387_135,
    burned: 44_720_774,
};

describe('L2Tiles', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        useL2WalletStore.setState({ ...initialState }, true);
    });
    afterEach(() => vi.useRealTimers());

    it('shows dashes until the first stats arrive', () => {
        render(<L2Tiles />);
        expect(screen.getByTestId('l2-epoch-countdown')).toHaveTextContent('-');
        expect(screen.queryByText('#11433')).not.toBeInTheDocument();
    });

    it('shows epoch progress and counts down to the next epoch', () => {
        render(<L2Tiles />);
        act(() => handleL2NetworkStats(stats));

        expect(screen.getByText('11,432')).toBeInTheDocument();
        expect(screen.getByText('#11433')).toBeInTheDocument();
        // 43 blocks left at 15 s a block.
        expect(screen.getByTestId('l2-epoch-countdown')).toHaveTextContent('10:45');
        act(() => vi.advanceTimersByTime(5000));
        expect(screen.getByTestId('l2-epoch-countdown')).toHaveTextContent('10:40');

        // A new block restarts the countdown from the fresh numbers.
        act(() => handleL2NetworkStats({ ...stats, block_height: stats.block_height + 1, blocks_into_epoch: 38 }));
        expect(screen.getByTestId('l2-epoch-countdown')).toHaveTextContent('10:30');
    });
});

describe('L2LaunchTile', () => {
    const launchAt = (value: unknown) => useAirdropStore.setState({ config: { 'ootle-mainnet-launch-at': value } });
    const digits = () =>
        screen
            .getAllByTestId('l2-launch-digits')
            .map((el) => el.textContent)
            .join(' ');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-11-05T00:00:00Z'));
        useAirdropStore.setState({ config: undefined });
    });
    afterEach(() => vi.useRealTimers());

    it('counts down days, hours, minutes and seconds to the launch, once a second', () => {
        launchAt('2026-11-07T03:04:05Z');
        render(<L2LaunchTile />);

        expect(screen.getByText('l2.pre-launch.countdown')).toBeInTheDocument();
        // Shown in local time, the way the countdown counts to it.
        const date = new Date('2026-11-07T03:04:05Z').toLocaleDateString('en', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
        expect(screen.getByText(date)).toBeInTheDocument();
        expect(screen.getByText('l2.pre-launch.days')).toBeInTheDocument();
        expect(digits()).toBe('02 03 04 05');
        act(() => vi.advanceTimersByTime(1000));
        expect(digits()).toBe('02 03 04 04');
        act(() => vi.advanceTimersByTime(5000));
        expect(digits()).toBe('02 03 03 59');
    });

    it('shows Launching soon once the target passes', () => {
        launchAt('2026-11-05T00:00:02Z');
        render(<L2LaunchTile />);

        expect(digits()).toBe('00 00 00 02');
        act(() => vi.advanceTimersByTime(2000));
        expect(screen.getByTestId('l2-launch-countdown')).toHaveTextContent('l2.pre-launch.soon');
    });

    it('shows Launching soon for a target already in the past', () => {
        launchAt('2026-11-01T00:00:00Z');
        render(<L2LaunchTile />);

        // Only the label, no negative or zero countdown next to it.
        expect(screen.getByTestId('l2-launch-countdown').textContent).toBe('l2.pre-launch.soon');
    });

    it('follows a new launch date from a config refetch', () => {
        launchAt('2026-11-06T00:00:00Z');
        render(<L2LaunchTile />);
        expect(digits()).toBe('01 00 00 00');

        act(() => launchAt('2026-11-08T00:00:00Z'));
        expect(digits()).toBe('03 00 00 00');
    });

    it.each([
        ['no config', undefined],
        ['a missing launch date', {}],
        ['a launch date that is not a string', { 'ootle-mainnet-launch-at': 1_800_000_000_000 }],
        ['a launch date that is not a date', { 'ootle-mainnet-launch-at': 'soon' }],
    ])('renders no countdown for %s', (_, config) => {
        useAirdropStore.setState({ config });
        render(<L2LaunchTile />);

        expect(screen.queryByTestId('l2-launch-countdown')).not.toBeInTheDocument();
        expect(screen.queryByText('l2.pre-launch.countdown')).not.toBeInTheDocument();
    });
});
