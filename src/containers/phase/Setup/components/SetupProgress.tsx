import { LinearProgress } from '@app/components/elements/LinearProgress';
import { Typography } from '@app/components/elements/Typography';
import { useAppStateStore } from '@app/store/appStateStore';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { memo, useMemo } from 'react';

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
const SetupProgress = memo(function SetupProgress() {
    const { t } = useTranslation('setup-view');

    const setupTitle = useAppStateStore((s) => s.setupTitle);
    const setupTitleParams = useAppStateStore((s) => s.setupTitleParams);
    const setupProgress = useAppStateStore((s) => s.setupProgress);

    const progressPercentage = useMemo(() => Math.floor(setupProgress * 100), [setupProgress]);
    const setUpText = setupTitle ? t(`setup-view:title.${setupTitle}`, setupTitleParams) : '';

    return (
        <Wrapper>
            <Percentage>{progressPercentage}%</Percentage>
            <InfoText variant="p">{setUpText}</InfoText>
            <LinearProgress value={progressPercentage} variant="small" />
        </Wrapper>
    );
});

export default SetupProgress;
