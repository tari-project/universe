import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonWrapper, StyledButton } from './BridgeButton.styles';
import { BRIDGE_TAPPLET_ID, useTappletsStore } from '@app/store/useTappletsStore';
import { setError, setVisualMode } from '@app/store';
import { setShowTapplet, setSidebarOpen } from '@app/store/actions/uiStoreActions';
import { useTappletProviderStore } from '@app/store/useTappletProviderStore';

export default function BridgeButton() {
    const { t } = useTranslation('bridge', { useSuspense: false });
    const { setActiveTappById } = useTappletsStore();
    const { initTappletProvider } = useTappletProviderStore();

    const handleClick = useCallback(
        async (tappletId: number) => {
            try {
                initTappletProvider();
                setActiveTappById(tappletId, true);
                setShowTapplet(true);
                setVisualMode(false);
                setSidebarOpen(false);
            } catch (e) {
                setError(`Error while launching tapplet: ${e}`);
            }
        },
        [initTappletProvider, setActiveTappById]
    );

    return (
        <ButtonWrapper>
            <StyledButton
                size="large"
                $hasStarted={false}
                fluid
                onClick={() => handleClick(BRIDGE_TAPPLET_ID)}
                icon={null}
                disabled={false}
                $isLoading={false}
            >
                {t(`buy-tari`)}
            </StyledButton>
        </ButtonWrapper>
    );
}
