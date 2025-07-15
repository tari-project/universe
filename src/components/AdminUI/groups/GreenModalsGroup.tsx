/* eslint-disable i18next/no-literal-string */
import { AdminButton, ButtonGroup, CategoryLabel } from '../styles';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore';
import { useSecurityStore } from '@app/store/useSecurityStore.ts';
import { useShareRewardStore } from '@app/store/useShareRewardStore';

export function GreenModalsGroup() {
    const { showModal: showPaperWallet, setShowModal: setShowPaperWallet } = usePaperWalletStore();
    const { showModal: showStagedSecurity, setShowModal: setShowStagedSecurity } = useSecurityStore();
    const { showModal: showShareReward, setShowModal: setShowShareReward } = useShareRewardStore();

    return (
        <>
            <CategoryLabel>Green Modals</CategoryLabel>
            <ButtonGroup>
                <AdminButton onClick={() => setShowPaperWallet(!showPaperWallet)} $isActive={showPaperWallet}>
                    Paper Wallet
                </AdminButton>
                <AdminButton onClick={() => setShowStagedSecurity(!showStagedSecurity)} $isActive={showStagedSecurity}>
                    Staged Security
                </AdminButton>
                <AdminButton onClick={() => setShowShareReward(!showShareReward)} $isActive={showShareReward}>
                    Share Reward
                </AdminButton>
            </ButtonGroup>
        </>
    );
}
