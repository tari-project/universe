import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { useProgressCountdown } from './useProgressCountdown';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 6px;
`;

const Percentage = styled(Typography).attrs({ variant: 'p' })`
    font-weight: 700;
`;

const Label = styled(Typography).attrs({ variant: 'p' })`
    font-weight: 400;
    color: ${({ theme }) => theme.palette.text.default};
`;
export default function Progress() {
    const { t } = useTranslation('setup-progresses');
    const corePhaseInfoPayload = useSetupStore((state) => state.core_phase_setup_payload);
    const hardwarePhaseInfoPayload = useSetupStore((state) => state.hardware_phase_setup_payload);
    const nodePhaseInfoPayload = useSetupStore((state) => state.node_phase_setup_payload);
    const unknownPhaseInfoPayload = useSetupStore((state) => state.unknown_phase_setup_payload);
    const { countdown } = useProgressCountdown(120);

    const currentPhaseToShow = useMemo(() => {
        if (hardwarePhaseInfoPayload?.is_complete && Boolean(unknownPhaseInfoPayload)) {
            return unknownPhaseInfoPayload;
        }

        if (nodePhaseInfoPayload?.is_complete && Boolean(hardwarePhaseInfoPayload)) {
            return hardwarePhaseInfoPayload;
        }

        if (corePhaseInfoPayload?.is_complete && Boolean(nodePhaseInfoPayload)) {
            return nodePhaseInfoPayload;
        }

        return corePhaseInfoPayload;
    }, [corePhaseInfoPayload, hardwarePhaseInfoPayload, nodePhaseInfoPayload, unknownPhaseInfoPayload]);

    const setupProgress = currentPhaseToShow?.progress;

    const setUpText =
        countdown === 1
            ? `${countdown} ${t('second_remaining')}`
            : countdown > 1
              ? `${countdown} ${t('seconds_remaining')}`
              : t('any_moment_now');

    return (
        <Wrapper>
            <LinearProgress variant="large" value={setupProgress} />
            <Percentage>{`${setupProgress}%`}</Percentage>
            <Label>{setUpText}</Label>
        </Wrapper>
    );
}
