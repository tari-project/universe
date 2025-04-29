import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-flow: column;
    width: min(420px, 40vw);
    align-items: center;
    padding: min(0.1vmin + 1.4rem, 30px);
    gap: 20px;
`;

export const GraphicWrapper = styled.div`
    display: flex;
    position: absolute;
    align-items: center;
    justify-content: center;
    width: clamp(420px, 40vw, 600px);
    height: 100%;
    img {
        display: flex;
        width: auto;
        height: 100%;
    }
`;
export const HeaderTextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    position: relative;
    padding: 0 20px;
`;
export const HeaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    overflow: hidden;
    width: 100%;
    min-height: 136px;
    svg {
        position: absolute;
        z-index: 1;
        right: 14px;
        top: 14px;
    }
`;

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    span {
        color: ${({ theme }) => theme.palette.text.primary};
        opacity: 0.7;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.45;
        letter-spacing: -0.04rem;
    }
`;

export const TagLine = styled.div`
    color: #fff;
    text-align: center;
    font-family: 'IBM Plex Sans Hebrew', sans-serif;
    font-size: 10px;
    font-weight: 700;
    line-height: 84.2%; /* 8.42px */
    text-transform: uppercase;
    display: flex;
`;
export const Heading = styled.div`
    font-weight: 800;
    display: flex;
    text-transform: uppercase;
    font-family: DrukWide, sans-serif;
    text-align: center;
    font-size: 30px;
    line-height: 0.99;
`;

export const CTACopy = styled.div`
    text-transform: uppercase;
    font-family: DrukWide, sans-serif;
    font-size: 15px;
`;
