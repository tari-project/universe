import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { selectL2Account, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
import { handleL2WalletStateUpdate } from '@app/store/actions/l2WalletStoreActions.ts';
import type { L2WalletState } from '@app/types/events-payloads.ts';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { WalletWrapper } from '@app/components/wallet/sidebarWallet/wallet.styles.ts';
import L2Wallet from './L2Wallet.tsx';

const fetchL2State = () => invoke<L2WalletState>('l2_get_state').then(handleL2WalletStateUpdate);

const promptStyle = { justifyContent: 'center', alignItems: 'center', gap: 12, textAlign: 'center' } as const;

export default function L2WalletCard() {
    const { t } = useTranslation('wallet');
    const hasPin = useWalletStore((s) => s.is_pin_locked);
    const enabled = useL2WalletStore((s) => s.enabled);
    const account = useL2WalletStore(selectL2Account);
    const [enabling, setEnabling] = useState(false);
    const [error, setError] = useState('');

    // Events keep the store current; this catches up with whatever was sent before the card opened.
    useEffect(() => {
        if (!hasPin) return;
        fetchL2State().catch((e) => console.warn('Could not load L2 wallet state:', e));
    }, [hasPin]);

    async function enable() {
        setEnabling(true);
        setError('');
        try {
            await invoke('enable_l2_wallet');
            await fetchL2State();
        } catch (e) {
            setError(`${t('l2.enable-error')}${e}`);
        } finally {
            setEnabling(false);
        }
    }

    if (!hasPin) {
        return (
            <WalletWrapper style={promptStyle} data-testid="l2-pin-required">
                <Typography>{t('l2.pin-required')}</Typography>
                <Button
                    variant="black"
                    onClick={() => invoke('create_pin').catch((e) => console.error('Failed to create PIN:', e))}
                    data-testid="l2-set-pin"
                >
                    {t('l2.set-pin')}
                </Button>
            </WalletWrapper>
        );
    }

    if (!enabled) {
        return (
            <WalletWrapper style={promptStyle} data-testid="l2-not-enabled">
                <Typography>{t('l2.enable-description')}</Typography>
                <Button variant="black" onClick={enable} disabled={enabling} data-testid="l2-enable">
                    {t('l2.enable')}
                </Button>
                {error && <Typography variant="p">{error}</Typography>}
            </WalletWrapper>
        );
    }

    if (!account) {
        return (
            <WalletWrapper style={promptStyle} data-testid="l2-loading">
                <Typography>{t('l2.loading')}</Typography>
            </WalletWrapper>
        );
    }

    return <L2Wallet account={account} />;
}
