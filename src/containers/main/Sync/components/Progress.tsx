import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation('setup-view');
    const setupProgress = useSetupStore((s) => s.setupProgress);
    const setupTitle = useSetupStore((s) => s.setupTitle);
    const setupTitleParams = useSetupStore((s) => s.setupTitleParams);
    const setUpText = setupTitle ? t(`setup-view:title.${setupTitle}`, setupTitleParams) : '';
    const progressPercentage = Math.floor(setupProgress * 100);
    return (
        <Wrapper>
            <LinearProgress variant="large" value={progressPercentage} />
            <Percentage>{`${progressPercentage}%`}</Percentage>
            <Label>{setUpText}</Label>
        </Wrapper>
    );
}
