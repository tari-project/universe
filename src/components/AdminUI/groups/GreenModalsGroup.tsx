/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { usePaperWalletStore } from '@app/store/usePaperWalletStore';
import { useStagedSecurityStore } from '@app/store/useStagedSecurityStore';
import { useShareRewardStore } from '@app/store/useShareRewardStore';

export function GreenModalsGroup() {
    const { showModal: showPaperWallet, setShowModal: setShowPaperWallet } = usePaperWalletStore();
    const { showModal: showStagedSecurity, setShowModal: setShowStagedSecurity } = useStagedSecurityStore();
    const { showModal: showShareReward, setShowModal: setShowShareReward } = useShareRewardStore();

    return (
        <>
            <CategoryLabel>Green Modals</CategoryLabel>
            <ButtonGroup>
                <Button onClick={() => setShowPaperWallet(!showPaperWallet)} $isActive={showPaperWallet}>
                    Paper Wallet
                </Button>
                <Button onClick={() => setShowStagedSecurity(!showStagedSecurity)} $isActive={showStagedSecurity}>
                    Staged Security
                </Button>
                <Button onClick={() => setShowShareReward(!showShareReward)} $isActive={showShareReward}>
                    Share Reward
                </Button>
            </ButtonGroup>
        </>
    );
}
