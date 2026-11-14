import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './styles.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { setIsSwapping } from '@app/store/actions/walletStoreActions.ts';
import { setL2Open, setShowTapplet, setSidebarOpen } from '@app/store/actions/uiStoreActions.ts';
import { deactivateTapplet } from '@app/store/useTappletsStore.ts';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors.ts';
import { AppModuleStatus } from '@app/store/types/setup.ts';

export default function BuyButton() {
    const { t } = useTranslation('wallet');
    const isSwapping = Boolean(useWalletStore((s) => s.is_swapping));
    const walletModule = useSetupStore(setupStoreSelectors.selectWalletModule);
    const isWalletModuleFailed = walletModule?.status === AppModuleStatus.Failed;

    const handleToggle = useCallback(() => {
        if (isSwapping) {
            setIsSwapping(false);
            return;
        }
        setShowTapplet(false);
        deactivateTapplet();
        setSidebarOpen(false);
        setL2Open(false);
        setIsSwapping(true);
    }, [isSwapping]);

    return (
        <Button
            $isActive={isSwapping}
            $isToggle={true}
            type="button"
            onClick={handleToggle}
            disabled={isWalletModuleFailed}
            aria-label={t('swap.buy-tari')}
            title={t('swap.buy-tari')}
            data-testid="sidebar-buy-button"
            data-active={isSwapping}
        >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                    d="M10 10V8.5C10 6.29086 11.7909 4.5 14 4.5C16.2091 4.5 18 6.29086 18 8.5V10"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M6.5 10H21.5L20.3 21.2C20.1578 22.5269 19.038 23.5 17.7034 23.5H10.2966C8.96199 23.5 7.84217 22.5269 7.7 21.2L6.5 10Z"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path d="M14 14.2V19.3" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                <path d="M11.45 16.75H16.55" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
            </svg>
        </Button>
    );
}
