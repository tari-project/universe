import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useMiningStore } from '@app/store/useMiningStore';
import { ConnectionIcon } from './Settings.styles';
import { formatHashrate } from '@app/utils/formatHashrate';

export default function DebugSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const lastBlockTime = useMiningStore((state) => state.displayBlockTime);
    const isConnectedToTariNetwork = useMiningStore((s) => s.base_node?.is_connected);
    const connectedPeers = useMiningStore((state) => state.base_node?.connected_peers || []);
    const sha_network_hash_rate = useMiningStore((state) => state?.sha_network_hash_rate);
    const randomx_network_hash_rate = useMiningStore((state) => state?.randomx_network_hash_rate);

    const { daysString, hoursString, minutes, seconds } = lastBlockTime || {};
    const displayTime = `${daysString} ${hoursString} : ${minutes} : ${seconds}`;

    return (
        <>
            <Typography variant="h6">{t('debug-info', { ns: 'settings' })}</Typography>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="p">{t('last-block-added-time', { ns: 'settings' })}</Typography>
                <Typography>{displayTime}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="right" alignItems="center">
                <ConnectionIcon $isConnected={isConnectedToTariNetwork} size={20} />
                <Typography variant="p">
                    {t(isConnectedToTariNetwork ? 'connected-to-tari' : 'not-connected-to-tari', {
                        ns: 'settings',
                    })}
                </Typography>
            </Stack>
            <Stack>
                <Typography variant="h6">{t('connected-peers', { ns: 'settings' })}</Typography>
                {connectedPeers.map((peer, i) => (
                    <Typography variant="p" key={peer}>
                        {i + 1}. {peer}
                    </Typography>
                ))}
            </Stack>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="p">{t('sha-network-hash-rate', { ns: 'settings' })}</Typography>
                <Typography>{formatHashrate(sha_network_hash_rate || 0)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="p">{t('randomx-network-hash-rate', { ns: 'settings' })}</Typography>
                <Typography>{formatHashrate(randomx_network_hash_rate || 0)}</Typography>
            </Stack>
        </>
    );
}
