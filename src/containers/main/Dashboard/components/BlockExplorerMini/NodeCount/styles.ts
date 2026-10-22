import styled from 'styled-components';

const LINE_BUFFER = 12.5;
export const Wrapper = styled.div<{ $contentWidth?: number }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    position: relative;
    &:before,
    &:after {
        content: '';
        position: absolute;
        height: 1px;
        width: ${({ $contentWidth }) => ($contentWidth ? `calc(50% - ${$contentWidth / 2 + LINE_BUFFER}px)` : `44%`)};
        background-color: ${({ theme }) => theme.colors.greyscale[theme.mode === 'dark' ? 100 : 500]};
        opacity: 0.1;
    }

    &:before {
        left: 0;
    }
    &:after {
        right: 0;
    }
`;

export const Content = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    user-select: none;
`;

export const CountText = styled.div`
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.8px;
`;

export const Dot = styled.div`
    display: flex;
    background-color: #188750;
    width: 11px;
    height: 11px;
    flex-shrink: 0;
    border-radius: 50%;
`;
