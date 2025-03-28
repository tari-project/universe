import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';

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
    const localNodePhaseInfoPayload = useSetupStore((state) => state.local_node_phase_setup_payload);
    const unknownPhaseInfoPayload = useSetupStore((state) => state.unknown_phase_setup_payload);

    console.log('corePhaseInfoPayload', corePhaseInfoPayload);
    console.log('hardwarePhaseInfoPayload', hardwarePhaseInfoPayload);
    console.log('localNodePhaseInfoPayload', localNodePhaseInfoPayload);
    console.log('unknownPhaseInfoPayload', unknownPhaseInfoPayload);

    const currentPhaseToShow = useMemo(() => {
        if (hardwarePhaseInfoPayload?.is_complete) {
            return unknownPhaseInfoPayload;
        }

        if (localNodePhaseInfoPayload?.is_complete) {
            return hardwarePhaseInfoPayload;
        }

        if (corePhaseInfoPayload?.is_complete) {
            return localNodePhaseInfoPayload;
        }

        return corePhaseInfoPayload;
    }, [corePhaseInfoPayload, hardwarePhaseInfoPayload, localNodePhaseInfoPayload, unknownPhaseInfoPayload]);

    const setupPhaseTitle = currentPhaseToShow?.phase_title;
    const setupTitle = currentPhaseToShow?.title;
    const setupProgress = currentPhaseToShow?.progress;
    const setupParams = currentPhaseToShow?.title_params ? { ...currentPhaseToShow.title_params } : {};

    // const setUpText = setupTitle ? t(`setup-view:title.${setupTitle}`, setupTitleParams) : '';

    const setUpText =
        setupTitle && setupPhaseTitle
            ? `${t(`phase-title.${setupPhaseTitle}`)} | ${t(`title.${setupTitle}`, { ...setupParams })}`
            : '';
    return (
        <Wrapper>
            <LinearProgress variant="large" value={setupProgress} />
            <Percentage>{`${setupProgress}%`}</Percentage>
            <Label>{setUpText}</Label>
        </Wrapper>
    );
}
