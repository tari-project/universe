import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
`;

export const Button = styled.button<{ $isActive: boolean; $isToggle?: boolean }>`
    border: 1px solid #ebebeb;
    background: #fafafa;
    color: #111;

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    width: 56px;
    height: 56px;
    padding: 13px;
    border-radius: 12px;

    cursor: pointer;

    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        background: #111;
        color: #fafafa;
        border-color: #111;
    }

    &:active {
        background: #111;
        color: #fafafa;
        border-color: #111;
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
        pointer-events: none;
    }

    ${({ $isActive }) =>
        $isActive &&
        css`
            background: #111;
            color: #fafafa;
            border-color: #111;
            cursor: default;
        `}

    ${({ $isToggle }) =>
        $isToggle &&
        css`
            cursor: pointer;
        `}
`;

export const ConnectionWrapper = styled.div`
    position: absolute;
    top: -2px;
    left: -2px;
    z-index: 2;
`;
