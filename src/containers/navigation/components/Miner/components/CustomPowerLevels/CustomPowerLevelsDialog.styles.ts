import styled, { css } from 'styled-components';

export const CustomLevelsContent = styled.div`
    padding: 0 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
`;

export const CTAWrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px 0 0;
`;

export const CustomLevelsHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
    padding: 0 10px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

export const SuccessContainer = styled.div<{ $visible: boolean }>`
    overflow: hidden;
    padding: 8px;
    font-size: 12px;
    font-family: Poppins, sans-serif;
    color: #188750;
    border: 1px solid #188750;
    border-radius: 18px;
    background: rgba(24, 135, 80, 0.1);
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
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

export const CurrentModeDetails = styled.div`
    padding: 10px 0 0;
    p {
        color: ${({ theme }) => theme.palette.text.accent};
        span {
            opacity: 0.7;
            margin: 0 2px 0 0;
        }
    }
`;
