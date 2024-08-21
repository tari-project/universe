import { Stack, Typography } from '@mui/material';
import { useBlockInfo } from '@app/hooks/mining/useBlockInfo.ts';
import {Divider, Stack, Typography} from '@mui/material';

import {useBlockInfo} from '../../../../hooks/useBlockInfo.ts';
import {useBaseNodeStatusStore} from '../../../../store/useBaseNodeStatusStore.ts';
import {useCPUStatusStore} from '../../../../store/useCPUStatusStore.ts';
import {useShallow} from 'zustand/react/shallow';
import {useAppStatusStore} from "../../../../store/useAppStatusStore.ts";

function BlockInfo() {
    const p2pool = useAppStatusStore((s) => s.p2pool_stats);
    const tribe = p2pool?.tribe.name;
    let minersCount = p2pool?.num_of_miners;
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));
    const timeSince = useBlockInfo();
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const isP2poolEnabled = useAppStatusStore((state) => state.p2pool_enabled);
    const { displayBlock } = useBlockInfo();

    const timerMarkup =
        timeSince && isMining ? (
            <>
                <Divider orientation="vertical" flexItem/>
                <Stack>
                    <Typography variant="h6">{timeSince}</Typography>
                    <Typography variant="body2">Current floor build time</Typography>
                </Stack>
            </>
        ) : null;

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
            <Divider orientation="vertical" flexItem/>
            {p2poolStats}
            <Stack alignItems="flex-end">
                <Typography variant="h6">#{displayBlock}</Typography>
                <Typography variant="body2">Floor</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem/>
            <Stack>
                <Typography variant="h6">Tiny Green Whales</Typography>
                <Typography variant="body2">Last floor winner</Typography>
            </Stack>
            {timerMarkup}
        </Stack>
    );
}

export default BlockInfo;
