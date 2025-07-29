import styled, { css } from 'styled-components';

export const RangeLabel = styled.label`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
`;

export const InputDescription = styled.div`
    display: flex;
    justify-content: flex-end;
    font-size: 12px;
    color: ${({ theme }) => theme.palette.text.accent};
    gap: 4px;
    span {
        font-weight: bold;
    }
`;

export const WarningContainer = styled.div<{ $visible: boolean }>`
    overflow: hidden;
    padding: 0 15px;
    font-size: 12px;
    font-family: Poppins, sans-serif;
    color: #ff0000;
    border: 1px solid #ff0000;
    border-radius: 5px;
    background: rgba(255, 0, 0, 0.1);
    height: 0;
    opacity: 0;
    transition: all 0.3s ease-in-out;
    ${({ $visible }) =>
        $visible &&
        css`
            opacity: 0.7;
            padding: 8px 15px;
            max-height: 50px;
            height: auto;
        `}
`;
