/* eslint-disable i18next/no-literal-string */
import { useUIStore } from '@app/store/useUIStore';
import { AdminButton, ButtonGroup, CategoryLabel } from '../styles';

import { setConnectionStatus } from '@app/store/actions/uiStoreActions.ts';
import { setShowUniversalModal, useExchangeStore } from '@app/store/useExchangeStore.ts';

export function OtherUIGroup() {
    const showUniversalModal = useExchangeStore((s) => s.showUniversalModal);
    const connectionStatus = useUIStore((s) => s.connectionStatus);

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
            <CategoryLabel>Other UI</CategoryLabel>
            <ButtonGroup>
                <AdminButton onClick={shiftConnectionStatus}>Change connection status</AdminButton>
                <AdminButton onClick={() => setShowUniversalModal(!showUniversalModal)}>Universal XC Modal</AdminButton>
            </ButtonGroup>
        </>
    );
}
