import { Stack, Typography, Divider } from '@mui/material';

import { useBlockInfo } from '@app/hooks/mining/useBlockInfo.ts';

import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';

function BlockInfo() {
    const { displayBlock, timeSince } = useBlockInfo();
    const isMining = useCPUStatusStore(useShallow((s) => s.is_mining));

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
            <Stack>
                <Typography variant="h6">#{displayBlock}</Typography>
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
