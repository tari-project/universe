import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonWrapper, StyledButton } from './BridgeButton.styles';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { setError, setVisualMode } from '@app/store';
import { setShowTapplet, setSidebarOpen } from '@app/store/actions/uiStoreActions';
import { BRIDGE_TAPPLET_ID } from '@app/store/consts';

export default function BridgeButton() {
    const { t } = useTranslation('bridge', { useSuspense: false });
    const { setActiveTappById } = useTappletsStore();

    const handleClick = useCallback(async () => {
        try {
            setActiveTappById(BRIDGE_TAPPLET_ID, true);
            setShowTapplet(true);
            setVisualMode(false);
            setSidebarOpen(false);
        } catch (e) {
            setError(`Error while launching tapplet: ${e}`);
        }
    }, [setActiveTappById]);

    return (
        <ButtonWrapper>
            <StyledButton
                size="large"
                $hasStarted={false}
                fluid
                onClick={() => handleClick()}
                icon={null}
                disabled={false}
                $isLoading={false}
            >
                {t(`buy-tari`)}
            </StyledButton>
        </ButtonWrapper>
    );
}
