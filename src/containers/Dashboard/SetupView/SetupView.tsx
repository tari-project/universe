import setup from '@app/assets/setup.png';

import { SetupDescription, SetupPercentage, ProgressWrapper } from '../styles';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { FloatingImage } from './styles';
import { useTranslation } from 'react-i18next';
import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';

function SetupView({
    title,
    titleParams,
    progressPercentage,
}: {
    title: string;
    titleParams: Record<string, string>;
    progressPercentage: number;
}) {
    const { t } = useTranslation('setup-view', { useSuspense: false });

    return (
        <Stack justifyContent="center" alignItems="center" gap={8}>
            <FloatingImage src={setup} alt="Soon Meditating" />
            <Typography variant="h3">{t('setting-up')}</Typography>
            <SetupDescription>
                {t('this-might-take-a-few-minutes')}
                <br />
                {t('dont-worry')}
            </SetupDescription>

            <ProgressWrapper>
                <LinearProgress value={progressPercentage} variant="secondary" />
            </ProgressWrapper>
            <SetupPercentage>{`${progressPercentage}%`}</SetupPercentage>
            <SetupDescription>{title ? t(`title.${title}`, titleParams) : ''}</SetupDescription>
        </Stack>
    );
}

export default SetupView;
