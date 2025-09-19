import { useUIStore } from '@app/store/useUIStore';
import { AdminButton, ButtonGroup } from '../styles';

import { setConnectionStatus } from '@app/store/actions/uiStoreActions.ts';
import { setShowUniversalModal, useExchangeStore } from '@app/store/useExchangeStore.ts';
import { useCrewRewardsStore } from '@app/store/useCrewRewardsStore';

export function OtherUIGroup() {
    const showUniversalModal = useExchangeStore((s) => s.showUniversalModal);
    const connectionStatus = useUIStore((s) => s.connectionStatus);
    const setShowCrewRewards = useCrewRewardsStore((s) => s.setShowWidget);
    const showCrewRewards = useCrewRewardsStore((s) => s.showWidget);
    const shiftConnectionStatus = () => {
        if (connectionStatus === 'connected') {
            setConnectionStatus('disconnected');
        } else if (connectionStatus === 'disconnected') {
            setConnectionStatus('disconnected-severe');
        } else {
            setConnectionStatus('connected');
        }
    };

    return (
        <>
            <ButtonGroup>
                <AdminButton onClick={shiftConnectionStatus}>{`Change connection status`}</AdminButton>
                <AdminButton
                    onClick={() => setShowUniversalModal(!showUniversalModal)}
                >{`Universal XC Modal`}</AdminButton>
            </ButtonGroup>
            <ButtonGroup>
                <AdminButton onClick={() => setShowCrewRewards(!showCrewRewards)}>{`Toggle Crew Rewards`}</AdminButton>
            </ButtonGroup>
        </>
    );
}
