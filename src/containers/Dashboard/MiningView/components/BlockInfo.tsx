import { Stack, Typography, Divider } from '@mui/material';

import { useBlockInfo } from '@app/hooks/mining/useBlockInfo.ts';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';
import { useCPUStatusStore } from '@app/store/useCPUStatusStore.ts';
import { useShallow } from 'zustand/react/shallow';

function BlockInfo() {
    const timeSince = useBlockInfo();
    const block_height = useBaseNodeStatusStore((s) => s.block_height);
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
