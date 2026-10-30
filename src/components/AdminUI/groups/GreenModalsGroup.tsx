/* eslint-disable i18next/no-literal-string */
import { AdminButton, ButtonGroup } from '../styles';
import { useSecurityStore } from '@app/store/useSecurityStore.ts';
import { useShareRewardStore } from '@app/store/useShareRewardStore';

export function GreenModalsGroup() {
    const { modal, setModal } = useSecurityStore();
    const { showModal: showShareReward, setShowModal: setShowShareReward } = useShareRewardStore();

    return (
        <>
            <ButtonGroup>
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
