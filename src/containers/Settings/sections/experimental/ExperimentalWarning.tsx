import { Typography } from '@app/components/elements/Typography.tsx';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { Stack } from '@app/components/elements/Stack';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@app/store/useUIStore';
import styled from 'styled-components';
import { useCallback, useRef } from 'react';
import { useKeyboardEvent } from '@app/hooks/helpers/useKeyboardEvent.ts';

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
    const clickCount = useRef(0);
    const keyPressed = useRef(false);
    useKeyboardEvent({ keys: ['ArrowLeft'], callback: () => (keyPressed.current = true) });

    const { showExperimental, setShowExperimental, setVE } = useUIStore((s) => ({
        showExperimental: s.showExperimental,
        setShowExperimental: s.setShowExperimental,
        setVE: s.setVE,
    }));

    const handleVE = useCallback(() => {
        setVE(keyPressed.current && clickCount.current > new Date().getDay());
        clickCount.current += 1;
    }, [setVE]);

    return (
        <ExperimentalContainer onClick={handleVE}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">{t('experimental-title', { ns: 'settings' })}</Typography>
                <ToggleSwitch checked={showExperimental} onChange={() => setShowExperimental(!showExperimental)} />
            </Stack>
            <Typography variant="p">{t('experimental-warning', { ns: 'settings' })}</Typography>
        </ExperimentalContainer>
    );
}
