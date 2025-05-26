import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: max(200px, 40vw);
`;
export const HeaderSection = styled.div`
    display: flex;
    padding: 30px 30px 20px;
`;
export const Heading = styled(Typography).attrs({ variant: 'h4' })`
    line-height: 1.2;
    letter-spacing: -1px;
`;
