import { Stack, Typography, Divider } from '@mui/material';

function BlockInfo() {
  return (
    <Stack direction="row" spacing={2}>
      <Stack>
        <Typography variant="h6">#24,475</Typography>
        <Typography variant="body2">Floor</Typography>
      </Stack>
      <Divider orientation="vertical" flexItem />
      <Stack>
        <Typography variant="h6">Tiny Green Whales</Typography>
        <Typography variant="body2">Last floor winner</Typography>
      </Stack>
      <Divider orientation="vertical" flexItem />
      <Stack>
        <Typography variant="h6">01:23:05</Typography>
        <Typography variant="body2">Current floor build time</Typography>
      </Stack>
    </Stack>
  );
}

export default BlockInfo;
