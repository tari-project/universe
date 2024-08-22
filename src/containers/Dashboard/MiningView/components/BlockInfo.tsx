import {useBlockInfo} from '@app/hooks/mining/useBlockInfo.ts';
import {Divider, Stack, Typography} from '@mui/material';
import {useAppStatusStore} from "@app/store/useAppStatusStore.ts";

function BlockInfo() {
    const p2pool = useAppStatusStore((s) => s.p2pool_stats);
    const tribe = p2pool?.tribe.name;
    const minersCount = p2pool?.num_of_miners;
    const isP2poolEnabled = useAppStatusStore((state) => state.p2pool_enabled);
    const {displayBlock} = useBlockInfo();

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
            <Stack alignItems="flex-end">
                <Typography variant="h6">#{displayBlock}</Typography>
                <Typography variant="body2">Floor</Typography>
            </Stack>
        </Stack>
    );
}

export default BlockInfo;
