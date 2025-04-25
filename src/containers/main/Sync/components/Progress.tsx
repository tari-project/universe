import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useCurrentPhaseDetails } from './useCurrentPhaseDetails';
import { useProgressCountdown } from './useProgressCountdown';
import { NodeType, useNodeStore } from '@app/store/useNodeStore';

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

export const Timer = styled(Typography).attrs({ variant: 'p' })`
    white-space: pre;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const getNodeType = (nodeType?: NodeType) => {
    if (nodeType === 'LocalAfterRemote') return 'Local';
    if (nodeType === 'RemoteUntilLocal') return 'Remote';
    return nodeType;
};

export default function Progress() {
    const { t } = useTranslation('setup-progresses');
    const { setupPhaseTitle, setupTitle, setupProgress, setupParams } = useCurrentPhaseDetails();
    const { countdownText } = useProgressCountdown();
    const nodeType = useNodeStore((s) => getNodeType(s.node_type));

    const setUpText =
        setupTitle && setupPhaseTitle
            ? `${t(`phase-title.${setupPhaseTitle}`)} | ${t(`title.${setupTitle}`, { ...setupParams })}`
            : '';

    return (
        <Wrapper>
            <LinearProgress variant="large" value={setupProgress} />
            {setupProgress ? <Percentage>{`${setupProgress}%`}</Percentage> : null}
            {nodeType == 'Local' && <Label>{setUpText}</Label>}
            <Timer>{countdownText}</Timer>
        </Wrapper>
    );
}
