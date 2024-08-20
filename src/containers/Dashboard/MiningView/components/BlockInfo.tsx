import { Stack, Typography, Divider } from '@mui/material';
import { useBaseNodeStatusStore } from '@app/store/useBaseNodeStatusStore.ts';

function BlockInfo() {
    const block_height = useBaseNodeStatusStore((s) => s.block_height);

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
        </Stack>
    );
}

export default BlockInfo;
