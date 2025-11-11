import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 570px;
    padding: 0 20px;
    gap: 10px;

    @media (max-height: 750px) {
        gap: 0;
    }
`;

export const ChipWrapper = styled.div`
    display: flex;
    margin-bottom: min(0.8vh, 10px);
`;
export const ChipText = styled(Typography).attrs({
    variant: 'h5',
})`
    font-size: clamp(11px, 1.4vh, 16px);
    line-height: 1.1;
`;

export const Title = styled(Typography)`
    font-size: clamp(24px, 3vh, 30px);
    line-height: 1.2;
`;
