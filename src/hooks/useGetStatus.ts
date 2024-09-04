import useAppStateStore from '../store/appStateStore.ts';

import { invoke } from '@tauri-apps/api/tauri';
import useWalletStore from '../store/walletStore.ts';
import { useAppStatusStore } from '../store/useAppStatusStore.ts';
import { useInterval } from './useInterval.ts';
import { useCPUStatusStore } from '../store/useCPUStatusStore.ts';
import { useGPUStatusStore } from '../store/useGPUStatusStore.ts';
import { useBaseNodeStatusStore } from '../store/useBaseNodeStatusStore.ts';
import useMining from '@app/hooks/mining/useMining.ts';
import { useMainAppVersion } from '@app/hooks/useVersions.ts';
import { GpuMinerStatus } from '@app/types/app-status.ts';

const INTERVAL = 1000;

export function useGetStatus() {
    const setAppStatus = useAppStatusStore((s) => s.setAppStatus);
    const setBalanceData = useWalletStore((state) => state.setBalanceData);
    const setCPUStatus = useCPUStatusStore((s) => s.setCPUStatus);
    const setGPUStatus = useGPUStatusStore((s) => s.setGPUStatus);
    const setBaseNodeStatus = useBaseNodeStatusStore((s) => s.setBaseNodeStatus);
    const { error, setError } = useAppStateStore((s) => ({
        error: s.error,
        setError: s.setError,
    }));
    const setMode = useAppStatusStore((s) => s.setMode);

    useMainAppVersion();
    useMining();

    useInterval(
        () =>
            invoke('status')
                .then((status) => {
                    if (status) {
                        setAppStatus(status);
                        setCPUStatus(status.cpu);
                        setBaseNodeStatus(status.base_node);
                        console.info('status', status.gpu);
                        const gpuStatus: GpuMinerStatus = {
                            is_mining: status.gpu === undefined ? false : true,
                            hash_rate: status.gpu?.hash_rate || 0,
                            estimated_earnings: status.gpu?.estimated_earnings || 0,
                        };
                        setGPUStatus(gpuStatus);

                        if (status.cpu?.is_mining) {
                            if (!status.cpu?.connection.is_connected) {
                                setError('Xmrig connection lost!');
                            } else if (error === 'Xmrig connection lost!') {
                                setError('');
                            }
                        }
                        const wallet_balance = status.wallet_balance;

                        setBalanceData(wallet_balance);
                        setMode(status.mode);
                    } else {
                        console.error('Could not get status');
                    }
                })
                .catch((e) => {
                    console.error('Could not get status', e);
                    setError(e.toString());
                }),
        INTERVAL
    );
}
