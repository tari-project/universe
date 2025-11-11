/* eslint-disable i18next/no-literal-string */
import { AdminButton, ButtonGroup } from '../styles';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore';
import { useSecurityStore } from '@app/store/useSecurityStore.ts';
import { useShareRewardStore } from '@app/store/useShareRewardStore';

export function GreenModalsGroup() {
    const { showModal: showPaperWallet, setShowModal: setShowPaperWallet } = usePaperWalletStore();
    const { modal, setModal } = useSecurityStore();
    const { showModal: showShareReward, setShowModal: setShowShareReward } = useShareRewardStore();

    return (
        <>
            <ButtonGroup>
                <AdminButton onClick={() => setShowPaperWallet(!showPaperWallet)} $isActive={showPaperWallet}>
                    Paper Wallet
                </AdminButton>
                <AdminButton onClick={() => setModal('intro')} $isActive={modal === 'intro'}>
                    Staged Security
                </AdminButton>
                <AdminButton onClick={() => setShowShareReward(!showShareReward)} $isActive={showShareReward}>
                    Share Reward
                </AdminButton>
            </ButtonGroup>
        </>
    );
}
