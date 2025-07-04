import styled from 'styled-components';
import { m } from 'motion/react';

export const XCButton = styled.button`
    display: flex;
    height: 34px;
    align-items: center;
    justify-content: space-between;
    border-radius: 50px;
    background: rgba(0, 0, 0, 0.3);
    font-size: 11px;
    padding: 0 10px 0 14px;
    font-weight: 600;
    width: 100%;
    color: ${({ theme }) => theme.colors.greyscale[100]};

    transition: all 0.2s ease-in-out;

    &:hover {
        background: rgba(0, 0, 0, 0.4);
        color: ${({ theme }) => theme.colors.greyscale[150]};
    }
`;

export const MotionWrapper = styled(m.div)`
    overflow: hidden;
`;
