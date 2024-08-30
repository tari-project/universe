import { Divider, Stack, Typography } from '@mui/material';
import { useAppStatusStore } from '@app/store/useAppStatusStore.ts';
import { useTranslation } from 'react-i18next';

function P2pool() {
    const p2pool = useAppStatusStore((s) => s.p2pool_stats);
    const tribe = p2pool?.tribe.name;
    const minersCount = p2pool?.num_of_miners;
    const isP2poolEnabled = useAppStatusStore((state) => state.p2pool_enabled);
    const { t } = useTranslation('mining-view', { useSuspense: false });
    const p2poolChainHeight = p2pool?.share_chain_height;
    const tribeTotalEarnings = p2pool?.pool_total_earnings;

    const p2poolStats = isP2poolEnabled ? (
        <Stack direction="row" spacing={2}>
            <Stack>
                <Typography variant="h6">{tribe}</Typography>
                <Typography variant="body2">{t('tribe')}</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack>
                <Typography variant="h6">{minersCount}</Typography>
                <Typography variant="body2">{t('miners')}</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack>
                <Typography variant="h6">#{p2poolChainHeight}</Typography>
                <Typography variant="body2">{t('tribe-pool-height')}</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack>
                <Typography variant="h6">{tribeTotalEarnings} tXTM</Typography>
                <Typography variant="body2">{t('tribe-earnings')}</Typography>
            </Stack>
        </Stack>
    ) : null;

    return <>{p2poolStats}</>;
}

export default P2pool;
