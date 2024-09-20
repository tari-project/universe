import { m } from 'framer-motion';
import styled from 'styled-components';
export const EarningsContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: relative;
`;

export const EarningsWrapper = styled(m.div)`
    display: flex;
    align-items: flex-end;
    flex-direction: row;
    justify-content: center;
    span {
        display: flex;
        font-family: Druk, sans-serif;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: -0.1px;
    }

    @media (max-width: 1100px) {
        flex-direction: column;
        align-items: center;
    }
`;
