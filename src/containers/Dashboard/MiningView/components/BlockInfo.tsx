import { Stack, Typography, Divider } from '@mui/material';

import { useBlockInfo } from '../../../../hooks/useBlockInfo.ts';

function BlockInfo() {
    const { timeSince, blockHeight } = useBlockInfo();

    const timerMarkup = timeSince ? (
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
                <Typography variant="h6">#{blockHeight}</Typography>
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
