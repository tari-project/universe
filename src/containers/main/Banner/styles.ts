import styled from 'styled-components';

export const DashboardBanner = styled.div`
    width: 100%;
    max-height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${({ theme }) => theme.palette.background.secondary};
    border-radius: 15px;
    padding: 10px;
    gap: 10px;
    pointer-events: auto;
    position: relative;
    z-index: 1;

    span {
        color: ${({ theme }) => theme.palette.text.contrast};
        font-family: DrukWide, sans-serif;
        font-size: 17px;
        font-style: italic;
        font-weight: 700;
        line-height: 0.94;
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
    h6 {
        line-height: 0.8;
    }
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
    line-height: 0.915;
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
    color: ${({ theme }) => theme.colors.greyscale[100]};
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
