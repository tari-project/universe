import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { selectL2Account, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { handleL2WalletStateUpdate } from '@app/store/actions/l2WalletStoreActions.ts';
import { setL2Open } from '@app/store/actions/uiStoreActions.ts';
import type { L2WalletState } from '@app/types/events-payloads.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { WalletWrapper } from '@app/components/wallet/sidebarWallet/wallet.styles.ts';
import L2Wallet from './L2Wallet.tsx';

const fetchL2State = () => invoke<L2WalletState>('l2_get_state').then(handleL2WalletStateUpdate);

const promptStyle = { justifyContent: 'center', alignItems: 'center', gap: 12, textAlign: 'center' } as const;

export default function L2WalletCard() {
    const { t } = useTranslation('wallet');
    const hasPin = useWalletStore((s) => s.is_pin_locked);
    const enabled = useL2WalletStore((s) => s.enabled);
    const locked = useL2WalletStore((s) => s.locked);
    const seedChangePending = useL2WalletStore((s) => s.seedChangePending);
    const account = useL2WalletStore(selectL2Account);
    const open = hasPin && enabled && !locked;

    // Events keep the store current; this catches up with whatever was sent before the card opened.
    useEffect(() => {
        if (!hasPin) return;
        fetchL2State().catch((e) => console.warn('Could not load L2 wallet state:', e));
    }, [hasPin]);

    // The sidebar only shows the card once the wallet is open. If it locks again (a wallet
    // restart), close the card and let the sidebar ask for the PIN next time. A seed change
    // reopens the wallet itself, so the card waits for it.
    useEffect(() => {
        if (!open && !seedChangePending) setL2Open(false);
    }, [open, seedChangePending]);

    if (!open || !account) {
        return (
            <WalletWrapper style={promptStyle} data-testid="l2-loading">
                <Typography>{t('l2.loading')}</Typography>
            </WalletWrapper>
        );
    }

    return <L2Wallet account={account} />;
}
