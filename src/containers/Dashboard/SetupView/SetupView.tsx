import setup from '../../../assets/setup.png';
import { Stack, Typography } from '@mui/material';
import { StyledLinearProgress, ProgressBox } from '../styles';
import VisualMode from '../components/VisualMode';

function SetupView({ title, progressPercentage }: { title: string; progressPercentage: number }) {
    return (
        <Stack spacing={8} alignItems="center">
            <img src={setup} alt="Setup" style={{ maxWidth: '100%', height: 'auto' }} />{' '}
            <Stack spacing={2} alignItems="center">
                <Typography variant="h4">Setting up the Tari truth machine...</Typography>
                <Typography variant="body1" align="center">
                    This might take a few minutes.
                    <br />
                    Don’t worry you’ll only need to do this once.
                </Typography>
                <ProgressBox>
                    <StyledLinearProgress variant="determinate" value={progressPercentage} />
                </ProgressBox>
                <Typography variant="body1">{`${progressPercentage}% - ${title}`}</Typography>
            </Stack>
            <VisualMode />
        </Stack>
    );
}

export default SetupView;
