import * as m from 'motion/react-m';
import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled(m.div)`
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: min(10px, 0.75vmin);
    box-sizing: border-box;
    & * {
        pointer-events: all;
    }

    padding: 40px;
    background-color: #fafafa;
`;

export const Content = styled(m.div)`
    will-change: width;
    width: 100%;
    max-width: 800px;

    display: flex;
    flex-direction: column;
    gap: 47px;

    @media (max-height: 768px) {
        gap: 40px;
    }
`;

export const HeaderContent = styled(m.div)`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
`;

export const Heading = styled(Typography).attrs({ variant: 'h1' })`
    font-size: 48px;
    line-height: 120%;

    @media (max-height: 768px) {
        font-size: 40px;
    }
`;

export const SubHeading = styled(Typography).attrs({ variant: 'p' })`
    white-space: pre;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const HeaderGraphic = styled.div`
    user-select: none;
    max-width: 100%;

    video {
        width: 169px;
        height: 176px;
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
