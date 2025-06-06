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
    background: ${({ theme }) => (theme.mode === 'dark' ? '#121212' : '#f4f4f4')};
    border-radius: 5px;
`;

export const Circle = styled(m.div)`
    width: 22px;
    height: 22px;
    background: ${({ theme }) => (theme.mode === 'dark' ? '#121212' : '#f4f4f4')};
    border-radius: 50%;
`;
