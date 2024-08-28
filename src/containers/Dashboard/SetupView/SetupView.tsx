import setup from '@app/assets/setup.png';
import { Stack, Typography } from '@mui/material';
import { StyledLinearProgress, ProgressBox, SetupDescription, SetupPercentage } from '../styles';
import { FloatingImage } from './styles';

function SetupView({ title, progressPercentage }: { title: string; progressPercentage: number }) {
    return (
        <Stack spacing={0} alignItems="center" sx={{ position: 'relative', zIndex: '1' }}>
            <FloatingImage src={setup} alt="Setup" style={{ maxWidth: '260px', height: 'auto' }} />
            <Typography variant="h3" fontSize={21} mt={3.4}>
                Setting up the Tari truth machine...
            </Typography>
            <SetupDescription mt={0.4} mb={4}>
                This might take a few minutes.
                <br />
                Don’t worry you’ll only need to do this once.
            </SetupDescription>
            <ProgressBox>
                <StyledLinearProgress variant="determinate" value={progressPercentage} />
            </ProgressBox>
            <SetupPercentage mt={2.2}>{`${progressPercentage}%`}</SetupPercentage>
            <SetupDescription>{title}</SetupDescription>
        </Stack>
    );
}

export default SetupView;
