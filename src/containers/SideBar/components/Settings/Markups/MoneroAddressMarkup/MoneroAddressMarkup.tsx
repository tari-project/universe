import { useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import MoneroAddressEditor from './MoneroAddressEditor';
import { useAppStateStore } from '@app/store/appStateStore';

const MoneroAddressMarkup = () => {
    const setError = useAppStateStore((s) => s.setError);
    const { moneroAddress, setMoneroAddress } = useAppStatusStore((state) => ({
        moneroAddress: state.monero_address,
        setMoneroAddress: state.setMoneroAddress,
    }));

    const handleMoneroAddressChange = useCallback(
        async (moneroAddress: string) => {
            try {
                console.info('Setting Monero address', moneroAddress);
                await invoke('set_monero_address', { moneroAddress });
                setMoneroAddress(moneroAddress);
            } catch (error) {
                console.error('Failed to set Monero address', error);
                setError('Failed to set Monero address!');
            }
        },
        [setError, setMoneroAddress]
    );

    useEffect(() => {
        const fetchInitialData = async () => {
            const fetchedMoneroAddress = await invoke('get_monero_address');
            setMoneroAddress(fetchedMoneroAddress);
        };

        fetchInitialData();
    }, [setMoneroAddress]);

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
