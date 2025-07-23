import { memo } from 'react';
import { Button } from './styles.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { setSidebarOpen, setShowTapplet } from '@app/store/actions/uiStoreActions';
import { BRIDGE_TAPPLET_ID } from '@app/store/consts.ts';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';

const BridgeButton = memo(function BridgeButton() {
    const showTapplet = useUIStore((s) => s.showTapplet);
    const setActiveTappById = useTappletsStore((s) => s.setActiveTappById);
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning?.is_scanning);
    const isSettingUp = useSetupStore((s) => !s.appUnlocked);

    const isDisabled = isSettingUp || isWalletScanning;

    function handleToggleOpen() {
        if (isDisabled) return;
        setActiveTappById(BRIDGE_TAPPLET_ID, true);
        setShowTapplet(true);
        setSidebarOpen(false);
    }

    return (
        <Button $isActive={showTapplet} type="button" onClick={handleToggleOpen} disabled={isDisabled}>
            <svg width="28" height="33" viewBox="0 0 28 33" fill="none">
                <path
                    d="M15.2582 18.0473L15.2582 12.7737L9.47676 12.7737L0.23841 21.8571L9.48501e-07 21.7388L5.69432e-07 13.0667L7.80789 5.27356L15.2582 5.27356L15.2582 -6.82703e-07L24.4286 8.98146L15.2582 18.0473Z"
                    fill="currentColor"
                />
                <path
                    d="M27.2857 11L27.2857 19.894L19.4797 27.5091L12.0313 27.5091L12.0313 32.8572L2.85716 23.8469L12.0313 14.8366L12.0313 20.0684L17.8113 20.0684L26.927 11.1732L27.2857 11Z"
                    fill="currentColor"
                />
            </svg>
        </Button>
    );
});

export default BridgeButton;
