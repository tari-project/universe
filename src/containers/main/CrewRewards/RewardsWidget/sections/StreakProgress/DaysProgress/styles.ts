import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 1;
`;

export const Pills = styled.div`
    display: flex;
    align-items: center;
    gap: 3px;
`;

export const Pill = styled.div<{ $isActive?: boolean }>`
    width: 33.33333%;
    height: 6px;
    min-width: 6px;

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
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    letter-spacing: -0.3px;
    white-space: nowrap;
`;
