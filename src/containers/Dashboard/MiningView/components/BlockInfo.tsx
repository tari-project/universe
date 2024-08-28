import {Divider, Stack, Typography} from '@mui/material';
import {useAppStatusStore} from "@app/store/useAppStatusStore.ts";
import {useMiningStore} from '@app/store/useMiningStore.ts';

function BlockInfo() {
    const p2pool = useAppStatusStore((s) => s.p2pool_stats);
    const tribe = p2pool?.tribe.name;
    const minersCount = p2pool?.num_of_miners;
    const isP2poolEnabled = useAppStatusStore((state) => state.p2pool_enabled);
    const displayBlockHeight = useMiningStore((s) => s.displayBlockHeight);

    const p2poolStats = isP2poolEnabled ? (
        <Stack direction="row" spacing={2}>
            <Stack>
                <Typography variant="h6">{tribe}</Typography>
                <Typography variant="body2">Tribe</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem/>
            <Stack>
                <Typography variant="h6">{minersCount}</Typography>
                <Typography variant="body2">Miners</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem/>
        </Stack>
    ) : null;

    return (
        <Stack direction="row" spacing={2}>
            {p2poolStats}
            {displayBlockHeight ? (
                <Stack alignItems="flex-end">
                    <Typography variant="h6">#{displayBlockHeight}</Typography>
                    <Typography variant="body2">Floor</Typography>
                </Stack>
            ) : null}
        </Stack>
    );
}

export default BlockInfo;
