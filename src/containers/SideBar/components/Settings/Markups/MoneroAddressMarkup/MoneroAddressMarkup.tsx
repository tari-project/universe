import { useCallback } from 'react';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import MoneroAddressEditor from './MoneroAddressEditor';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

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
        <Stack>
            <Stack direction="row" justifyContent="space-between" style={{ height: 40 }}>
                <Typography variant="h6">Monero Address</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
                <MoneroAddressEditor initialAddress={moneroAddress || ''} onApply={handleMoneroAddressChange} />
            </Stack>
        </Stack>
    );
};

export default MoneroAddressMarkup;
