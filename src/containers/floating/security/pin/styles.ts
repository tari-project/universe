import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    padding: 30px;
    min-width: 580px;
`;

export const Header = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;
export const Heading = styled(Typography).attrs({
    variant: 'h4',
})`
    font-size: 18px;
`;
