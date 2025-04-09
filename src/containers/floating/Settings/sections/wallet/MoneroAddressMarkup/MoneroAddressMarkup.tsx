import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import MoneroAddressEditor from './MoneroAddressEditor';
import { SettingsGroupTitle, SettingsGroupWrapper } from '../../../components/SettingsGroup.styles.ts';
import { setDialogToShow, setMoneroAddress, useConfigWalletStore } from '@app/store';

const MoneroAddressMarkup = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const moneroAddress = useConfigWalletStore((s) => s.monero_address);

    const handleMoneroAddressChange = useCallback(async (moneroAddress: string) => {
        await setMoneroAddress(moneroAddress);
    }, []);

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
