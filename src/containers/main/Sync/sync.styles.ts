import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    padding: 40px;

    & * {
        pointer-events: all;
    }
`;

export const Content = styled(m.div)`
    will-change: width;
    width: 100%;
    max-width: 800px;

    display: flex;
    flex-direction: column;
    gap: 47px;

    transform: translateY(-20px);

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

export const Heading = styled(m.div)`
    text-align: center;
    font-family: Poppins, sans-serif;
    font-size: 48px;
    font-style: normal;
    font-weight: 600;
    line-height: 116%;

    @media (max-height: 768px) {
        font-size: 40px;
    }
`;

export const SubHeading = styled(m.div)`
    color: ${({ theme }) => theme.palette.text.secondary};

    text-align: center;
    font-family: Poppins, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;
    line-height: 137.5%;
`;

export const HeaderGraphic = styled.div`
    user-select: none;
    max-width: 100%;
    transform: translateY(10px);

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
