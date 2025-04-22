import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled('div')`
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 99999;

    display: flex;
    justify-content: center;
    align-items: center;

    pointer-events: all;

    overflow: hidden;
    overflow-y: auto;

    padding: 40px;
`;

export const Cover = styled(m.div)`
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 0;
    cursor: pointer;
`;

export const BoxWrapper = styled(m.div)`
    width: 100%;
    max-width: 481px;

    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 20px;

    padding: 30px;

    border-radius: 20px;
    background:;
    box-shadow: 0px 4px 74px 0px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(27px);

    position: relative;
    z-index: 1;

    background: ${({ theme }) => (theme.mode === 'dark' ? `rgba(46, 46, 46, 0.75)` : `rgba(255, 255, 255, 0.75)`)};
`;

export const CloseButton = styled('button')`
    cursor: pointer;

    transition: transform 0.2s ease;
    height: 31px;

    &:hover {
        transform: scale(1.1);
    }
`;

export const TopWrapper = styled('div')`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    ${({ theme }) => (theme.mode === 'dark' ? `#fff` : `#000`)};
`;

export const Title = styled('div')`
    font-family: Poppins, sans-serif;
    font-size: 18px;
    font-style: normal;
    font-weight: 600;
    line-height: 31px;
`;
