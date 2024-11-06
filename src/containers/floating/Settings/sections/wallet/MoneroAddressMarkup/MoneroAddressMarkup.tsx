import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import MoneroAddressEditor from './MoneroAddressEditor';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useUIStore } from '@app/store/useUIStore.ts';
import { SettingsGroupTitle, SettingsGroupWrapper } from '../../../components/SettingsGroup.styles.ts';

const MoneroAddressMarkup = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const moneroAddress = useAppConfigStore((s) => s.monero_address);
    const setMoneroAddress = useAppConfigStore((s) => s.setMoneroAddress);
    const setDialogToShow = useUIStore((s) => s.setDialogToShow);

    const handleMoneroAddressChange = useCallback(
        async (moneroAddress: string) => {
            await setMoneroAddress(moneroAddress);
            setDialogToShow('restart');
        },
        [setDialogToShow, setMoneroAddress]
    );

    return (
        <SettingsGroupWrapper $advanced>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('monero-address.title')}</Typography>
            </SettingsGroupTitle>
            <Stack direction="row" justifyContent="space-between">
                <MoneroAddressEditor initialAddress={moneroAddress || ''} onApply={handleMoneroAddressChange} />
            </Stack>
        </SettingsGroupWrapper>
    );
};

export default MoneroAddressMarkup;
