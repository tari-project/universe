import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ $isInline: boolean }>`
    position: relative;
    z-index: 1;
    pointer-events: all;

    width: 100%;

    * {
        pointer-events: all;
    }

    ${({ $isInline }) =>
        !$isInline &&
        css`
            position: absolute;
            top: 95px;
            left: 0;
            z-index: 0;
        `}
`;

const MessageBox = styled.div<{ $isInline: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;

    padding: 8px 10px;
    min-height: 33px;

    border-radius: 10px;

    ${({ $isInline }) =>
        !$isInline &&
        css`
            padding: 30px 14px 11px 14px;
            border-radius: 13px;
        `}
`;

export const StreakMessage = styled(MessageBox)`
    background: #00a505;
`;

export const UnlockMessage = styled(MessageBox)`
    background: #df881c;
`;

export const LoadingMessage = styled(MessageBox)`
    background: #5b5c5c;
`;

export const Text = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;

    white-space: nowrap;
    letter-spacing: -0.3px;
    min-height: 16px;
    display: flex;
    align-items: center;
`;

export const StreakText = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
    line-height: 109.386%;
    letter-spacing: -0.36px;
`;
