/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const countdownMock = vi.hoisted(() => ({
    value: -1,
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('@app/containers/main/Sync/components/useProgressCountdown.ts', () => ({
    useProgressCountdown: () => ({ countdown: countdownMock.value }),
}));

import { render, screen, waitFor } from '@app/test/test-utils';
import SyncCountdown from './SyncCountdown';

describe('SyncCountdown', () => {
    beforeEach(() => {
        countdownMock.value = -1;
    });

    it('starts after a sync estimate becomes available', async () => {
        const onCompleted = vi.fn();
        const onStarted = vi.fn();
        const { rerender } = render(<SyncCountdown onCompleted={onCompleted} onStarted={onStarted} />);

        expect(screen.getByText('setup-progresses:calculating_time')).toBeInTheDocument();
        expect(onStarted).not.toHaveBeenCalled();

        countdownMock.value = 120;
        rerender(<SyncCountdown onCompleted={onCompleted} onStarted={onStarted} />);

        await waitFor(() => expect(onStarted).toHaveBeenCalledOnce());
        expect(screen.getByText('2m')).toBeInTheDocument();
        expect(onCompleted).not.toHaveBeenCalled();
    });
});
