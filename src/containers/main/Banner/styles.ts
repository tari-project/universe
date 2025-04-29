import styled from 'styled-components';

export const DashboardBanner = styled.div`
    width: 100%;
    height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${({ theme }) => theme.palette.background.secondary};
    border-radius: 15px;
    padding: 0 10px;
    gap: 10px;
    pointer-events: auto;

    span {
        color: ${({ theme }) => theme.palette.text.contrast};
        font-family: DrukWide, sans-serif;
        font-size: 17px;
        font-style: italic;
        font-weight: 700;
        line-height: 94.2%; /* 16.014px */
        text-transform: uppercase;
    }
`;

export const FlexSection = styled.div`
    display: flex;
    width: fit-content;
    gap: 20px;
`;

export const BodyCopy = styled.div`
    display: flex;
    text-align: right;
    justify-content: end;
    align-items: center;
    color: ${({ theme }) => theme.colors.greyscale[100]};
    flex-wrap: wrap;
    strong {
        color: #ffab25; // TODO: add new colours to theme
    }
`;

export const TagLine = styled.div`
    display: flex;
    color: ${({ theme }) => theme.colors.greyscale[100]};
    font-family: DrukWide, sans-serif;
    font-size: 17px;
    font-style: italic;
    font-weight: 700;
    line-height: 0.95;
    text-transform: uppercase;
    flex-direction: column;
    span {
        color: ${({ theme }) => theme.colors.brightGreen[500]};
    }
`;

export const VideoPreview = styled.div`
    display: flex;
    width: 66px;
    border-radius: 6px;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 46px;
    color: #ffffff;
    transition: transform 0.2s ease-in;
    cursor: pointer;
    &:hover {
        svg {
            transform: scale(1.1);
        }
    }
    svg {
        display: flex;
        position: absolute;
        height: 18px;
        z-index: 1;
    }
    video {
        display: flex;
        height: 100%;
        width: auto;
        filter: blur(0.04rem);
    }
`;
