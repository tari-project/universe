import styled, { css } from 'styled-components';

export const CustomLevelsContent = styled.div`
    padding: 0 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 700px;
`;

export const CustomLevelsHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    padding: 0 10px 10px;
    border-bottom: 1px solid #0000000d;
`;

export const SuccessContainer = styled.div<{ $visible: boolean }>`
    overflow: hidden;
    padding: 15px;
    font-size: 12px;
    font-family: Poppins, sans-serif;
    color: #188750;
    border: 1px solid #188750;
    border-radius: 5px;
    background: rgba(24, 135, 80, 0.1);
    opacity: 0;
    transition: all 0.3s ease-in-out;
    ${({ $visible }) =>
        $visible &&
        css`
            opacity: 1;
        `}
`;

export const TopRightContainer = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
`;
