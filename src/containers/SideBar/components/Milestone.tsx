import { Stack, Typography } from '@mui/material';
import { StyledLinearProgress, ProgressBox, GemBox } from '../styles';
import { useTranslation } from 'react-i18next';

function Milestones() {
    const { t } = useTranslation('sidebar', { useSuspense: false });

    const progress = 70;
    return (
        <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography variant="body2">{t('next-milestone')}</Typography>
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
