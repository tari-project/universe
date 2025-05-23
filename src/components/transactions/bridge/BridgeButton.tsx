import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ButtonWrapper, StyledButton } from './BridgeButton.styles';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { setError, setVisualMode, useWalletStore } from '@app/store';
import { setShowTapplet, setSidebarOpen } from '@app/store/actions/uiStoreActions';
import { BRIDGE_TAPPLET_ID } from '@app/store/consts';
import { useTariBalance } from '@app/hooks/wallet/useTariBalance';

export default function BridgeButton() {
    const { t } = useTranslation('bridge', { useSuspense: false });
    const { setActiveTappById } = useTappletsStore();
    const { isWalletScanning } = useTariBalance();
    const availableBalance = useWalletStore((s) => s.balance?.available_balance);

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
                disabled={isWalletScanning || !availableBalance}
                $isLoading={false}
            >
                {t(`buy-tari`)}
            </StyledButton>
        </ButtonWrapper>
    );
}
