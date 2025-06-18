import { useTranslation } from 'react-i18next';
import { usePaperWalletStore } from '@app/store';
import SyncTooltip from '@app/containers/navigation/components/Wallet/SyncTooltip/SyncTooltip.tsx';
import { PhoneSVG } from '@app/assets/icons/phone.tsx';
import { ActionButton } from './styles.ts';

export default function ActionPhoneSync() {
    const { t } = useTranslation(['wallet', 'sidebar']);
    const setShowPaperWalletModal = usePaperWalletStore((s) => s.setShowModal);

    return (
        <SyncTooltip
            title={t('sidebar:paper-wallet-tooltip-title')}
            text={t('sidebar:paper-wallet-tooltip-message')}
            trigger={
                <ActionButton onClick={() => setShowPaperWalletModal(true)}>
                    <PhoneSVG />
                </ActionButton>
            }
        />
    );
}
