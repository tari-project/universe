import * as m from 'motion/react-m';
import styled from 'styled-components';

export const BoxWrapper = styled(m.div)`
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 20px;
    //padding: 30px;
    //border-radius: 20px;
    //box-shadow: 0 4px 74px 0 rgba(0, 0, 0, 0.15);
    position: relative;
    //z-index: 1;
    //background-color: ${({ theme }) => theme.palette.background.splash};
`;

export const TopButton = styled('button')`
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
