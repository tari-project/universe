import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 6px;
`;

const Label = styled(Typography).attrs({ variant: 'p' })`
    font-weight: 700;
`;
export default function Progress() {
    const setupProgress = useSetupStore((s) => s.setupProgress);
    const progressPercentage = Math.floor(setupProgress * 100);
    return (
        <Wrapper>
            <LinearProgress variant="large" value={progressPercentage} />
            <Label>{`${progressPercentage}%`}</Label>
        </Wrapper>
    );
}
