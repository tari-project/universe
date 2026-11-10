import { useTranslation } from 'react-i18next';

import { NavWrapper, NavButton } from './styles.ts';
import {
    enforceMandatoryWalletSecurity,
    openWalletSecurityFlow,
    useIsWalletSecured,
    useIsWalletSecurityMandatory,
    useWalletStore,
} from '@app/store';

interface WalletActionsProps {
    section: string;
    setSection: (section: string) => void;
}
export default function WalletActions({ section, setSection }: WalletActionsProps) {
    const { t } = useTranslation(['wallet', 'sidebar']);
    const isScanning = useWalletStore((s) => !s.wallet_scanning.is_initial_scan_complete);
    const isSecured = useIsWalletSecured();
    const isSecurityMandatory = useIsWalletSecurityMandatory();

    const handleSendClick = () => {
        if (!isSecured || isSecurityMandatory) {
            if (!enforceMandatoryWalletSecurity()) {
                openWalletSecurityFlow();
            }
            return;
        }
        setSection('send');
    };

    return (
        <NavWrapper>
            <NavButton
                $isActive={section === 'send'}
                aria-selected={section === 'send'}
                onClick={handleSendClick}
                disabled={isScanning || !isSecured || isSecurityMandatory}
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
        </NavWrapper>
    );
}
