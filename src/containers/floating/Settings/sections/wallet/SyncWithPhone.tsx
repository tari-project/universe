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

import { usePaperWalletStore } from '@app/store/usePaperWalletStore.ts';

export const SyncWithPhone = () => {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const setShowPaperWalletModal = usePaperWalletStore((s) => s.setShowModal);

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('sidebar:paper-wallet-tooltip-title')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('sidebar:paper-wallet-tooltip-message')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Button onClick={() => setShowPaperWalletModal(true)}>
                        {t('sidebar:paper-wallet-tooltip-title')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
};
