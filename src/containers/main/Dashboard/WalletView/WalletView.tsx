import { memo } from 'react';
import { WalletViewContainer } from '@app/containers/main/Dashboard/WalletView/WalletView.styles.ts';
import { Balance } from '@app/components/transactions/earnings/Balance.tsx';
import SyncTooltip from '@app/containers/main/SidebarNavigation/components/Wallet/SyncTooltip/SyncTooltip.tsx';
import { useTranslation } from 'react-i18next';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore.ts';

const WalletView = memo(function WalletView() {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const setShowPaperWalletModal = usePaperWalletStore((s) => s.setShowModal);
    const handleSyncButtonClick = (e) => {
        e.stopPropagation();
        setShowPaperWalletModal(true);
    };
    return (
        <WalletViewContainer>
            <Balance />
            <SyncTooltip
                title={t('paper-wallet-tooltip-title')}
                text={t('paper-wallet-tooltip-message')}
                trigger={
                    <Button size="xs" onClick={handleSyncButtonClick}>
                        {t('paper-wallet-button')}
                    </Button>
                }
            />
            <div style={{ textAlign: 'center', fontSize: 140 }}>{`👻`}</div>
        </WalletViewContainer>
    );
});

export default WalletView;
