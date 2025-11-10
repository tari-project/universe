import styled, { css } from 'styled-components';

export const TopContent = styled.div`
    width: 100%;
    display: flex;
    gap: 40px;
    align-items: center;
    justify-content: space-between;
    height: 34px;
`;
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
    font-size: 13px;
    line-height: 1;
    color: ${({ theme }) => theme.palette.text.accent};
    gap: 4px;
`;

export const WarningContainer = styled.div<{ $visible: boolean }>`
    overflow: hidden;
    padding: 0 8px;
    font-size: 12px;
    line-height: 1;
    font-family: Poppins, sans-serif;
    color: #ff0000;
    border: 2px solid rgba(255, 0, 0, 0.65);
    border-radius: 32px;
    background: rgba(255, 0, 0, 0.05);
    height: 0;
    opacity: 0;
    text-align: center;
    transition: all 0.2s ease-out;

    font-weight: 500;
    ${({ $visible }) =>
        $visible &&
        css`
            opacity: 0.8;
            padding: 8px;
            max-height: 100%;
            height: auto;
        `}
`;
