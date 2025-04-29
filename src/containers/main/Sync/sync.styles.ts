import * as m from 'motion/react-m';
import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled(m.div)`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: min(10px, 0.75vmin);
    box-sizing: border-box;
    & * {
        pointer-events: all;
    }
`;

export const Content = styled(m.div)`
    height: 100%;
    will-change: width;
    width: min(100%, 80vw);
    display: grid;
    grid-template-rows: min-content max-content auto;
    overflow: hidden;
    place-content: space-between;
    gap: min(40px, 2vh);
    @media (max-height: 955px) {
        gap: min(20px, 1vh);
    }
`;

export const HeaderContent = styled(m.div)`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

export const Heading = styled(Typography).attrs({ variant: 'h1' })`
    font-size: min(max(26px, 3vw), 48px);
`;

export const SubHeading = styled(Typography).attrs({ variant: 'p' })`
    white-space: pre;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const HeaderGraphic = styled.div`
    width: min(220px, 24vh);
    user-select: none;
    max-width: 100%;
    video {
        max-width: 100%;
    }
`;

export const ActionContent = styled(m.div)`
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    gap: 15px;
    width: 100%;
    height: 100%;
`;
export const FooterContent = styled(m.div)`
    display: flex;
    width: 100%;
    align-items: center;
    padding: 0 0 5px;
`;
