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

    margin-top: 7px;

    background-color: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#fff')};
    color: ${({ theme }) => (theme.mode === 'dark' ? '#fff' : '#000')};
    padding: 8px 20px;
    border-radius: 100px;
    width: max-content;
    max-width: 220px;

    box-shadow: 0px 0px 115px 0px rgba(0, 0, 0, 0.35);
`;
