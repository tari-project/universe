import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ $isHovering?: boolean }>`
    position: relative;
    display: inline-block;
    width: 51px;
    height: 51px;

    transition: scale 0.2s ease;

    ${({ $isHovering }) =>
        $isHovering &&
        css`
            scale: 1.08;
        `}
`;

export const SVGContainer = styled.svg`
    transform-origin: center;
`;

export const BackgroundArc = styled.path`
    fill: none;
    stroke-linecap: round;
`;

export const ProgressArc = styled.path<{ $animationDuration: number }>`
    fill: none;
    stroke-linecap: round;
    transition: ${(props) => `stroke-dashoffset ${props.$animationDuration}ms ease-in-out`};
`;

export const GradientStop = styled.stop<{ $stopColor: string }>`
    stop-color: ${(props) => props.$stopColor};
    transition: stop-color 0.2s ease;
`;

export const TextContainer = styled.div`
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    margin-left: 3px;
    display: flex;
    align-items: center;
    justify-content: center;

    color: #3a3835;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    opacity: 0.5;
    text-align: center;
`;

export const CubeContainer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transform: translateX(3px);
`;
