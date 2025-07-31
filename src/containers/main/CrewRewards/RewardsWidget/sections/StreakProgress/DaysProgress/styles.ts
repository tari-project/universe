import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 9px;
`;

export const Pills = styled.div`
    display: flex;
    align-items: center;
    gap: 3px;
`;

export const Pill = styled.div<{ $isActive?: boolean }>`
    width: 31px;
    height: 5px;
    flex-shrink: 0;

    border-radius: 100px;
    opacity: 0.4;
    background: #d9d9d9;

    ${({ $isActive }) =>
        $isActive &&
        css`
            opacity: 1;
            background: #02f90e;
        `}
`;

export const Text = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 109.386%;
    letter-spacing: -0.36px;
`;
