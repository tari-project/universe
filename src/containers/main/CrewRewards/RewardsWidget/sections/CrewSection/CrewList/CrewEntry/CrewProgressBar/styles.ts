import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: center;

    border-radius: 100px;
    background: rgba(0, 0, 0, 0.2);

    padding: 2px;
    width: 100%;
    position: relative;
    height: 21px;
`;

export const ProgressPercent = styled.div`
    position: absolute;
    top: 5px;
    left: 8px;

    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: 100%;
    letter-spacing: 0.24px;
    pointer-events: none;
`;

export const ProgressBar = styled.div<{ $progress: number }>`
    width: ${({ $progress }) => `${$progress}%`};
    height: 100%;
    border-radius: 100px;
    background: #00a505;

    will-change: width;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
`;
