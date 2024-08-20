import { Stack, Typography, Divider } from '@mui/material';
import { useBlockInfo } from '@app/hooks/mining/useBlockInfo.ts';

function BlockInfo() {
    const { displayBlock } = useBlockInfo();


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
        </Stack>
    );
}

export default BlockInfo;
