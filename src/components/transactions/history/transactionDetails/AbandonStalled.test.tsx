/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, type Mock } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { render, screen, fireEvent } from '@app/test/test-utils';
import { AbandonStalled } from './AbandonStalled';

function mockInvoke(abandon: (args: unknown) => Promise<unknown>) {
    const invokeMock = vi.mocked(invoke) as unknown as Mock<(command: string, args?: unknown) => Promise<unknown>>;
    invokeMock.mockImplementation(async (command, args) => {
        if (command === 'abandon_stalled_transaction') return abandon(args);
        return [];
    });
    return invokeMock;
}

describe('AbandonStalled', () => {
    it('abandons a stalled transaction after showing the warning', async () => {
        const abandon = vi.fn(async () => undefined);
        const invokeMock = mockInvoke(abandon);
        render(<AbandonStalled stalledId="12" />);

        fireEvent.click(await screen.findByTestId('tx-details-abandon'));
        expect(screen.getByText('abandon.note')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('tx-details-abandon-confirm'));

        expect(await screen.findByText('abandon.done')).toBeInTheDocument();
        expect(abandon).toHaveBeenCalledWith({ txId: '12', acceptUnreconcilable: false });
        invokeMock.mockResolvedValue([]);
    });

    it('warns that an abandoned burn may still land', async () => {
        const invokeMock = mockInvoke(async () => undefined);
        render(<AbandonStalled stalledId="12" isBurn />);

        fireEvent.click(await screen.findByTestId('tx-details-abandon'));
        expect(screen.getByText('abandon.burn-note')).toBeInTheDocument();
        expect(screen.queryByText('abandon.note')).not.toBeInTheDocument();
        invokeMock.mockResolvedValue([]);
    });

    it('never offers to abandon a burn without change', async () => {
        const invokeMock = mockInvoke(async () => {
            throw '[abandon_no_change_output] Abandon failed: no change output';
        });
        render(<AbandonStalled stalledId="12" isBurn />);

        fireEvent.click(await screen.findByTestId('tx-details-abandon'));
        fireEvent.click(screen.getByTestId('tx-details-abandon-confirm'));

        expect(await screen.findByText('abandon.error-burn-unreconcilable')).toBeInTheDocument();
        expect(screen.queryByTestId('tx-details-abandon-anyway')).not.toBeInTheDocument();
        invokeMock.mockResolvedValue([]);
    });

    it('asks again before abandoning a transaction without change', async () => {
        const abandon = vi.fn(async (args: unknown) => {
            if (!(args as { acceptUnreconcilable: boolean }).acceptUnreconcilable) {
                throw '[abandon_no_change_output] Abandon failed: no change output';
            }
        });
        const invokeMock = mockInvoke(abandon);
        render(<AbandonStalled stalledId="12" />);

        fireEvent.click(await screen.findByTestId('tx-details-abandon'));
        fireEvent.click(screen.getByTestId('tx-details-abandon-confirm'));
        expect(await screen.findByText('abandon.unreconcilable-note')).toBeInTheDocument();
        fireEvent.click(screen.getByTestId('tx-details-abandon-anyway'));

        expect(await screen.findByText('abandon.done')).toBeInTheDocument();
        expect(abandon).toHaveBeenLastCalledWith({ txId: '12', acceptUnreconcilable: true });
        invokeMock.mockResolvedValue([]);
    });

    it('explains a refusal by its error code', async () => {
        const invokeMock = mockInvoke(async () => {
            throw '[abandon_not_pending] Abandon failed: Send 12 is not stalled';
        });
        render(<AbandonStalled stalledId="12" />);

        fireEvent.click(await screen.findByTestId('tx-details-abandon'));
        fireEvent.click(screen.getByTestId('tx-details-abandon-confirm'));

        expect(await screen.findByText('abandon.error-not-pending')).toBeInTheDocument();
        invokeMock.mockResolvedValue([]);
    });
});
