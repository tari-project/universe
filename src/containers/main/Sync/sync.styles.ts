import * as m from 'motion/react-m';
import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled(m.div)`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    will-change: contents;
    & * {
        pointer-events: all;
    }
`;

export const Content = styled(m.div)`
    height: 100%;
    will-change: width;
    width: min(100%, 80vw);
    display: grid;
    grid-auto-columns: 100%;
    grid-template-rows: 5fr 2fr 1fr;
    place-items: center;
    align-content: center;
    overflow: hidden;
    gap: min(15px, 8vh);
    padding: calc(0.4rem + 1vmin);
`;

export const HeaderContent = styled(m.div)`
    display: flex;
    flex-flow: column;
    align-items: center;
    text-align: center;
`;

export const Heading = styled(Typography).attrs({ variant: 'h1' })`
    font-size: min(max(30px, 3.5vw), 50px);
`;

export const SubHeading = styled(Typography).attrs({ variant: 'p' })`
    white-space: pre;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const HeaderImg = styled.img`
    width: min(360px, 36vh);
    max-width: 100%;
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
    align-items: flex-end;
`;
