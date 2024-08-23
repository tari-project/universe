import { Stack, Typography } from '@mui/material';
import { useMiningStore } from '@app/store/useMiningStore.ts';

function BlockInfo() {
    const displayBlockHeight = useMiningStore((s) => s.displayBlockHeight);

    return (
        <Stack direction="row" spacing={2}>
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
