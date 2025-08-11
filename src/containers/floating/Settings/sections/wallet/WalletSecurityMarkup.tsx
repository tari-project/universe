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
import { AlertChip } from '@app/components/security/alert-chip/AlertChip.tsx';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useSecurityStore } from '@app/store/useSecurityStore.ts';
import { useFetchExchangeBranding } from '@app/hooks/exchanges/fetchExchangeContent.ts';

export const WalletSecurityMarkup = () => {
    const { t } = useTranslation('staged-security', { useSuspense: false });
    const isPinLocked = useWalletStore((s) => s.is_pin_locked);
    const isSeedBackedUp = useWalletStore((s) => s.is_seed_backed_up);
    const setModal = useSecurityStore((s) => s.setModal);
    const { data: xcData } = useFetchExchangeBranding();

    const setPin = useCallback(() => {
        const isExchangeMiner = xcData?.id !== 'universal';
        setModal(isExchangeMiner ? 'create_pin' : 'intro');
    }, [setModal, xcData?.id]);

    return !isPinLocked || !isSeedBackedUp ? (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('warning.title')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Button variant="black" onClick={setPin}>
                            {t('warning.title')}
                        </Button>
                    </SettingsGroupTitle>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <AlertChip text={t('intro.warning')} />
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    ) : null;
};
