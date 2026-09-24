import { useTranslation } from 'react-i18next';

import { NavWrapper, NavButton } from './styles.ts';
import { useMiningStore, useWalletStore } from '@app/store';
import { networkSupportsBurn } from '@app/utils/network';

interface WalletActionsProps {
    section: string;
    setSection: (section: string) => void;
}
export default function WalletActions({ section, setSection }: WalletActionsProps) {
    const { t } = useTranslation(['wallet', 'sidebar']);
    const isScanning = useWalletStore((s) => !s.wallet_scanning.is_initial_scan_complete);
    const canBurn = useMiningStore((s) => networkSupportsBurn(s.network));

    return (
        <NavWrapper>
            <NavButton
                $isActive={section === 'send'}
                aria-selected={section === 'send'}
                onClick={() => setSection('send')}
                disabled={isScanning}
                data-testid="wallet-send-button"
            >
                {t('tabs.send')}
            </NavButton>
            <NavButton
                $isActive={section === 'receive'}
                aria-selected={section === 'receive'}
                onClick={() => setSection('receive')}
                data-testid="wallet-receive-button"
            >
                {t('tabs.receive')}
            </NavButton>
            {canBurn && (
                <NavButton
                    $isActive={section === 'burn'}
                    aria-selected={section === 'burn'}
                    onClick={() => setSection('burn')}
                    disabled={isScanning}
                    data-testid="wallet-burn-button"
                >
                    {t('tabs.burn')}
                </NavButton>
            )}
        </NavWrapper>
    );
}
