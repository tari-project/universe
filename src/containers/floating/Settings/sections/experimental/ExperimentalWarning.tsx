import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { Stack } from '@app/components/elements/Stack';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@app/store/useUIStore';
import styled from 'styled-components';

const ExperimentalContainer = styled.div`
    padding: 15px;
    border-radius: 5px;
    box-shadow: 0 4px 45px 0 rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0 0 20px 0;
`;

export default function ExperimentalWarning() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const { showExperimental, setShowExperimental } = useUIStore((s) => ({
        showExperimental: s.showExperimental,
        setShowExperimental: s.setShowExperimental,
    }));

    return (
        <ExperimentalContainer>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">{t('experimental-title', { ns: 'settings' })}</Typography>
                <ToggleSwitch checked={showExperimental} onChange={() => setShowExperimental(!showExperimental)} />
            </Stack>
            <Typography variant="p">{t('experimental-warning', { ns: 'settings' })}</Typography>
        </ExperimentalContainer>
    );
}
