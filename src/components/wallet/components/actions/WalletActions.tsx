import { useTranslation } from 'react-i18next';

import { NavWrapper, NavButton } from './styles.ts';
import { useWalletStore } from '@app/store';

interface WalletActionsProps {
    section: string;
    setSection: (section: string) => void;
}
export default function WalletActions({ section, setSection }: WalletActionsProps) {
    const { t } = useTranslation(['wallet', 'sidebar']);
    const isScanning = useWalletStore((s) => !s.wallet_scanning.is_initial_scan_finished);

    return (
        <NavWrapper>
            <NavButton
                $isActive={section === 'send'}
                aria-selected={section === 'send'}
                onClick={() => setSection('send')}
                disabled={isScanning}
            >
                {t('tabs.send')}
            </NavButton>
            <NavButton
                $isActive={section === 'receive'}
                aria-selected={section === 'receive'}
                onClick={() => setSection('receive')}
            >
                {t('tabs.receive')}
            </NavButton>
        </NavWrapper>
    );
}
