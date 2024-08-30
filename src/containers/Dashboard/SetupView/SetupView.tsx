import setup from '@app/assets/setup.png';

import { StyledLinearProgress, ProgressBox, SetupDescription, SetupPercentage } from '../styles';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { FloatingImage } from './styles';
import { useTranslation } from 'react-i18next';

function SetupView({ title, progressPercentage }: { title: string; progressPercentage: number }) {
    const { t } = useTranslation('setup-view', { useSuspense: false });

    return (
        <Stack>
            <FloatingImage src={setup} alt="Soon Meditating" />
            <Typography variant="h3">{t('setting-up')}</Typography>
            <SetupDescription>
                {t('this-might-take-a-few-minutes')}
                <br />
                {t('dont-worry')}
            </SetupDescription>
            <ProgressBox>
                <StyledLinearProgress value={progressPercentage} />
            </ProgressBox>
            <SetupPercentage>{`${progressPercentage}%`}</SetupPercentage>
            <SetupDescription>{t(`title.${title}`)}</SetupDescription>
        </Stack>
    );
}

export default SetupView;
