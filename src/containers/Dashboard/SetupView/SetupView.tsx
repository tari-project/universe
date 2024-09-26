import { useLottie } from 'lottie-react';
import { SetupDescription, SetupPercentage, ProgressWrapper } from '../styles';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import soon from '@app/assets/lotties/VECTOR_SOON.json';
import { SoonWrapper } from '@app/containers/Dashboard/SetupView/styles.ts';

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
    const { View: soonLottie } = useLottie({ animationData: soon });

    return (
        <Stack justifyContent="center" alignItems="center" gap={8}>
            <SoonWrapper>{soonLottie}</SoonWrapper>
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
