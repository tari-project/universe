import { Stack, Typography } from '@mui/material';
import { useBlockInfo } from '@app/hooks/mining/useBlockInfo.ts';

function BlockInfo() {
    const { displayBlock } = useBlockInfo();

    return (
        <Stack direction="row" spacing={2}>
            <Stack alignItems="flex-end">
                <Typography variant="h6">#{displayBlock}</Typography>
                <Typography variant="body2">Floor</Typography>
            </Stack>
        </Stack>
    );
}

export default BlockInfo;
