import setup from '@app/assets/setup.png';
import { Stack, Typography } from '@mui/material';
import { StyledLinearProgress, ProgressBox, SetupDescription, SetupPercentage } from '../styles';
import { FloatingImage } from './styles';
import { useTranslation } from 'react-i18next';

function SetupView({ title, progressPercentage }: { title: string; progressPercentage: number }) {
    const { t } = useTranslation('setup-view', { useSuspense: false });

    return (
        <Stack spacing={0} alignItems="center" sx={{ position: 'relative', zIndex: '1' }}>
            <FloatingImage src={setup} alt="Soon Meditating" />
            <Typography variant="h3" fontSize={21} mt={3.4}>
                {t('setting-up')}
            </Typography>
            <SetupDescription mt={0.4} mb={4}>
                {t('this-might-take-a-few-minutes')}
                <br />
                {t('dont-worry')}
            </SetupDescription>
            <ProgressBox>
                <StyledLinearProgress variant="determinate" value={progressPercentage} />
            </ProgressBox>
            <SetupPercentage mt={2.2}>{`${progressPercentage}%`}</SetupPercentage>
            <SetupDescription>{t(`title.${title}`)}</SetupDescription>
        </Stack>
    );
}

export default SetupView;
