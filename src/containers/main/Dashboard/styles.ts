import styled from 'styled-components';
import { m } from 'motion';

export const DashboardContentContainer = styled(m.div)`
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    flex-grow: 1;
    position: relative;
`;

export const ProgressWrapper = styled.div`
    margin: 20px 0;
    display: flex;
    width: 100%;
`;
