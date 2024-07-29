import { Stack, Typography, Divider } from '@mui/material';
import { BlockInfoContainer } from '../../styles';

function BlockInfo() {
  return (
    <BlockInfoContainer>
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
    </BlockInfoContainer>
  );
}

export default BlockInfo;
