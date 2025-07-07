import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useCurrentPhaseDetails } from './useCurrentPhaseDetails';
import { useProgressCountdown } from './useProgressCountdown';
import { useNodeStore } from '@app/store/useNodeStore';
import { convertHexToRGBA } from '@app/utils';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 10px;
`;

const TextGroup = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
`;

const Percentage = styled(Typography).attrs({ variant: 'p' })`
    font-weight: 700;
`;

const ProgressWrapper = styled.div`
    width: 100%;
    border-radius: 20px;
    background: ${({ theme }) => theme.palette.background.paper};
    box-shadow: ${({ theme }) => `1px 1px 15px -5px ${convertHexToRGBA(theme.palette.contrast, 0.07)}`};
    border: 1px solid ${({ theme }) => theme.palette.background.accent};
`;

const Label = styled(Typography).attrs({ variant: 'p' })`
    font-weight: 400;
    color: ${({ theme }) => theme.palette.text.default};
`;

export const Timer = styled(Typography).attrs({ variant: 'p' })`
    white-space: pre;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export default function Progress() {
    const { t } = useTranslation('setup-progresses');
    const { setupPhaseTitle, setupTitle, setupProgress, setupParams } = useCurrentPhaseDetails();
    const { countdownText } = useProgressCountdown();
    const nodeType = useNodeStore((s) => s.node_type);

    const setUpText =
        setupTitle && setupPhaseTitle
            ? `${t(`phase-title.${setupPhaseTitle}`)} | ${t(`title.${setupTitle}${setupParams.progress ? '-download' : ''}`, { ...setupParams })}`
            : '';

    return (
        <Wrapper>
            <ProgressWrapper>
                <LinearProgress variant="large" value={setupProgress} />
            </ProgressWrapper>
            <TextGroup>
                {setupProgress ? <Percentage>{`${setupProgress}%`}</Percentage> : null}
                {nodeType === 'Local' && <Label>{setUpText}</Label>}
                <Timer>{countdownText}</Timer>
            </TextGroup>
        </Wrapper>
    );
}
