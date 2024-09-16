import { Stack } from '@app/components/elements/Stack';
import { StyledLinearProgress, ProgressBox, GemBox } from '../styles';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';

function Milestones() {
    const { t } = useTranslation('sidebar', { useSuspense: false });

    const progress = 70;
    return (
        <Stack>
            <Stack>
                <Typography variant="p">{t('next-milestone')}</Typography>
                <Typography variant="p">5 XTR</Typography>
            </Stack>
            <ProgressBox>
                <StyledLinearProgress value={progress} />
                <GemBox />
            </ProgressBox>
        </Stack>
    );
}

export default Milestones;
