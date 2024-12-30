import { LinearProgress } from '@app/components/elements/LinearProgress';
import { Typography } from '@app/components/elements/Typography';
import { useAppStateStore } from '@app/store/appStateStore';
import NumberFlow from '@number-flow/react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 246px;
`;

const Percentage = styled(Typography)`
    font-weight: 700;
    line-height: 1;
`;

const InfoText = styled(Typography)`
    font-weight: 400;
    margin-bottom: 14px;
    white-space: nowrap;
`;
export default function SetupProgress() {
    const { t } = useTranslation('setup-view');
    const setupTitle = useAppStateStore((s) => s.setupTitle);
    const setupTitleParams = useAppStateStore((s) => s.setupTitleParams);
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const progressPercentage = Math.floor(setupProgress * 100);

    return (
        <Wrapper>
            <Percentage>
                <NumberFlow value={setupProgress} willChange={true} continuous={true} format={{ style: 'percent' }} />
            </Percentage>
            <InfoText variant="p">{setupTitle ? t(`setup-view:title.${setupTitle}`, setupTitleParams) : ''}</InfoText>
            <LinearProgress value={progressPercentage} variant="small" />
        </Wrapper>
    );
}
