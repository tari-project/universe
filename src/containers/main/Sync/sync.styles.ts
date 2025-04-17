import * as m from 'motion/react-m';
import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled(m.div)`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
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
    grid-auto-columns: 100%;
    grid-template-rows: 4fr 2fr 1fr;
    place-items: stretch;
    align-content: center;
    overflow: hidden;
    gap: 40px;
    padding: calc(0.3rem + 1vmin);
    @media (max-height: 955px) {
        gap: 30px;
    }
`;

export const HeaderContent = styled(m.div)`
    display: flex;
    flex-flow: column;
    align-items: center;
    text-align: center;
`;

export const Heading = styled(Typography).attrs({ variant: 'h1' })`
    font-size: min(max(28px, 3.25vw), 48px);
`;

export const SubHeading = styled(Typography).attrs({ variant: 'p' })`
    white-space: pre;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const HeaderGraphic = styled.div`
    width: min(360px, 32vh);
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
`;
