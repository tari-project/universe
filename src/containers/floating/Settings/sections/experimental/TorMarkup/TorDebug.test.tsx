/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { render, screen, waitFor } from '@app/test/test-utils';
import { useNodeStore } from '@app/store/useNodeStore';
import { TorDebug } from './TorDebug';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

const invokeMock = invoke as unknown as Mock<(cmd: string) => Promise<unknown>>;

describe('TorDebug', () => {
    beforeEach(() => {
        invokeMock.mockReset();
        useNodeStore.setState({ tor_entry_guards: ['$OLD~startup'] });
    });

    it('re-reads the entry guards when the panel opens', async () => {
        invokeMock.mockResolvedValue(['$NEW~guard1 up', '$NEW~guard2 down']);
        render(<TorDebug />);

        expect(invokeMock).toHaveBeenCalledWith('get_tor_entry_guards');
        await waitFor(() => expect(screen.getByText('$NEW~guard1')).toBeInTheDocument());
        expect(screen.queryByText('$OLD~startup')).not.toBeInTheDocument();
        expect(screen.queryByText('$NEW~guard2')).not.toBeInTheDocument();
    });

    it('shows no guards when Tor answers with an empty list', async () => {
        // An empty answer is Tor's current state (e.g. right after a restart), so the
        // startup list must not be kept: showing guards Tor no longer uses is the bug.
        invokeMock.mockResolvedValue([]);
        render(<TorDebug />);

        await waitFor(() => expect(screen.getByText('no-entry-guard')).toBeInTheDocument());
        expect(screen.queryByText('$OLD~startup')).not.toBeInTheDocument();
    });

    it('keeps the last known guards when Tor cannot be queried', async () => {
        invokeMock.mockRejectedValue('Tor control port is not initialized');
        render(<TorDebug />);

        await waitFor(() => expect(invokeMock).toHaveBeenCalledWith('get_tor_entry_guards'));
        expect(screen.getByText('$OLD~startup')).toBeInTheDocument();
    });
});
