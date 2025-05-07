import { m } from 'motion/react';
import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
`;

export const ListItemsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    padding-top: 6px;
`;

export const Rectangle = styled(m.div)`
    width: 100%;
    height: 48px;
    background: ${({ theme }) => (theme.mode === 'dark' ? '#222223' : '#F3F3F3')};
    border-radius: 10px;
    flex-shrink: 0;
`;

export const LoadingText = styled(m.div)`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    z-index: 1;

    background-color: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    color: ${({ theme }) => (theme.mode === 'dark' ? '#fff' : '#000')};
    padding: 8px 20px;
    border-radius: 8px;
    max-width: 220px;
    width: 100%;

    box-shadow:
        0px 0px 1px rgba(3, 7, 18, 0.08),
        0px 1px 3px rgba(3, 7, 18, 0.06),
        0px 2px 7px rgba(3, 7, 18, 0.05),
        0px 4px 13px rgba(3, 7, 18, 0.03),
        0px 6px 20px rgba(3, 7, 18, 0.02);
`;
