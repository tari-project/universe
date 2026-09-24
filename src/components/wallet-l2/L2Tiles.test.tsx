import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@app/test/test-utils';
import { initialState, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { handleL2NetworkStats } from '@app/store/actions/l2WalletStoreActions.ts';
import L2Tiles from './L2Tiles';

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
