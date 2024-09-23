import { useCallback } from 'react';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import MoneroAddressEditor from './MoneroAddressEditor';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { SettingsGroupTitle, SettingsGroupWrapper } from '@app/containers/Settings/components/SettingsGroup.styles.ts';

const MoneroAddressMarkup = () => {
    const moneroAddress = useAppConfigStore((s) => s.monero_address);
    const setMoneroAddress = useAppConfigStore((s) => s.setMoneroAddress);

    const handleMoneroAddressChange = useCallback(
        async (moneroAddress: string) => {
            await setMoneroAddress(moneroAddress);
        },
        [setMoneroAddress]
    );

    return (
        <SettingsGroupWrapper $advanced>
            <SettingsGroupTitle>
                <Typography variant="h6">Monero Address</Typography>
            </SettingsGroupTitle>
            <Stack direction="row" justifyContent="space-between">
                <MoneroAddressEditor initialAddress={moneroAddress || ''} onApply={handleMoneroAddressChange} />
            </Stack>
        </SettingsGroupWrapper>
    );
};

export default MoneroAddressMarkup;
