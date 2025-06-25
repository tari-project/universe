import { m } from 'motion/react';
import styled from 'styled-components';

export const Wrapper = styled.div`
    height: 31px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const SquareWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
`;

export const Square = styled(m.div)`
    width: 24px;
    height: 31px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
`;
