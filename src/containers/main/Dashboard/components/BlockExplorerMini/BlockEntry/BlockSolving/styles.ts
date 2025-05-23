import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const Wrapper = styled(m.div)`
    display: flex;
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    pointer-events: none;
`;

export const BoxWrapper = styled(m.div)<{ $isSolved?: boolean }>`
    display: flex;
    border-radius: 100px;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;

    border: 1px solid rgba(255, 144, 18, 0.3);
    background: rgba(255, 204, 75, 0.3);
    backdrop-filter: blur(23px);

    padding: 8px;
    width: 316px;
    height: 89px;

    ${({ $isSolved }) =>
        $isSolved &&
        css`
            border: 1px solid rgba(148, 227, 151, 0.5);
            background: rgba(148, 227, 151, 0.5);
        `};
`;

export const Inside = styled.div<{ $isSolved?: boolean }>`
    display: flex;
    align-items: center;
    gap: 14px;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;

    border-radius: 100px;

    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;

    background: #fccf5f;

    ${({ $isSolved }) =>
        $isSolved &&
        css`
            background: #a5ee9e;
        `};
`;

export const ContentWrapper = styled.div<{ $isSolved?: boolean }>`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    position: absolute;
    top: 0;
    right: 0px;
    z-index: 0;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;

    width: 150px;
    height: 100%;

    background: linear-gradient(to right, #fccf5f, #ffb128);

    ${({ $isSolved }) =>
        $isSolved &&
        css`
            background: linear-gradient(to right, #a8efa2, #8ee193);
        `};
`;

export const Title = styled.div`
    color: #111;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 119.8%;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    pointer-events: none;

    strong {
        font-weight: 600;
    }
`;

export const VideoWrapper = styled.div`
    position: absolute;
    top: 0px;
    left: 0px;
    width: 140px;
    height: 100%;
    overflow: hidden;
    z-index: 1;

    iframe,
    video {
        width: 100%;
        height: 100%;
        pointer-events: none;
        border: none;
        object-fit: cover;
    }
`;
