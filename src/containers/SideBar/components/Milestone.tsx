import { Stack, Typography } from '@mui/material';
import { StyledLinearProgress, ProgressBox, GemBox } from '../styles';

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
                <GemBox />
            </ProgressBox>
        </Stack>
    );
}

export default Milestones;
