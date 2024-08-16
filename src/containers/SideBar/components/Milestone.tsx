import { Stack, Typography } from '@mui/material';
import { StyledLinearProgress, ProgressBox } from '../styles';
import gem from '@app/assets/images/gem-sml.png';

function Milestones() {
    const progress = 70;
    return (
        <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography variant="body2">Next milestone</Typography>
                <Typography variant="body2">5 XTR</Typography>
            </Stack>
            <ProgressBox>
                <StyledLinearProgress variant="determinate" value={progress} />
                <img src={gem} alt="gem" />
            </ProgressBox>
        </Stack>
    );
}

export default Milestones;
