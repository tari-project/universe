import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { setupStoreSelectors } from '@app/store/selectors/setupStoreSelectors.ts';

export const RefreshWalletHistory = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const walletModuleInitialized = useSetupStore(setupStoreSelectors.isWalletModuleInitialized);

    const resetWalletHistory = useCallback(async () => {
        try {
            await invoke('refresh_wallet_history');
            console.info('Wallet history reset successfully');

            // await refreshTransactions();
        } catch (error) {
            console.error('Failed to reset wallet history:', error);
        }
    }, []);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('refresh-wallet-history')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('refresh-wallet-history-description')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Button disabled={!walletModuleInitialized} onClick={resetWalletHistory}>
                        {t('refresh-wallet-history')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};
