import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { Network } from '@app/utils/network.ts';
import { useHasL2Access } from './useHasL2Access.ts';
import { useIsL2PreLaunch } from './useIsL2PreLaunch.ts';

describe('L2 flags on localnet', () => {
    it('shows L2 and treats it as live without any flags', () => {
        useMiningStore.setState({ network: Network.LocalNet });
        useAirdropStore.setState({ features: undefined });
        expect(renderHook(() => useHasL2Access()).result.current).toBe(true);
        expect(renderHook(() => useIsL2PreLaunch()).result.current).toBe(false);
    });

    it('keeps mainnet gated on the flags', () => {
        useMiningStore.setState({ network: Network.MainNet });
        useAirdropStore.setState({ features: undefined });
        expect(renderHook(() => useHasL2Access()).result.current).toBe(false);
        expect(renderHook(() => useIsL2PreLaunch()).result.current).toBe(true);
    });
});
