import { Stack, Typography, Divider } from '@mui/material';

import { useBlockInfo } from '../../../../hooks/useBlockInfo.ts';
import { useBaseNodeStatusStore } from '../../../../store/useBaseNodeStatusStore.ts';
import { useCPUStatusStore } from '../../../../store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';

function BlockInfo() {
    const p2pool = useAppStatusStore((s) => s.p2pool_stats);
    const tribe = p2pool?.tribe.name;
    const minersCount = p2pool?.num_of_miners;
    const timeSince = useBlockInfo();
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));

    useEffect(() => {
        // Function to calculate the time difference
        const calculateTimeSince = () => {
            const now: Date = new Date();
            const past: Date = new Date(blockTime * 1000); // Convert seconds to milliseconds
            const diff: number = now.getTime() - past.getTime();

    const timerMarkup =
        timeSince && isMining ? (
            <>
                <Divider orientation="vertical" flexItem />
                <Stack>
                    <Typography variant="h6">{timeSince}</Typography>
                    <Typography variant="body2">Current floor build time</Typography>
                </Stack>
            </>
        ) : null;

    return (
        <Stack direction="row" spacing={2}>
            <Divider orientation="vertical" flexItem />
            <Stack>
                <Typography variant="h6">{tribe}</Typography>
                <Typography variant="body2">Tribe</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack>
                <Typography variant="h6">{minersCount}</Typography>
                <Typography variant="body2">Miners</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack>
                <Typography variant="h6">#{block_height}</Typography>
                <Typography variant="body2">Floor</Typography>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Stack>
                <Typography variant="h6">Tiny Green Whales</Typography>
                <Typography variant="body2">Last floor winner</Typography>
            </Stack>
            {timerMarkup}
        </Stack>
    );
}

export default BlockInfo;
