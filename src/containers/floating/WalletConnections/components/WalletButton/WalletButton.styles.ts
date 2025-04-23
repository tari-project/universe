import styled, { css } from 'styled-components';

export const WalletActionButton = styled.button<{
    $disabled?: boolean;
    $variant?: 'primary' | 'secondary' | 'error';
    $size?: 'small' | 'medium' | 'large';
}>`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 1px 12px;
    border-radius: 30px;
    background: #ffffff40;
    cursor: pointer;
    font-family: Poppins;
    font-weight: 600;
    font-size: 12px;
    line-height: 26px;
    letter-spacing: 0.46px;
    text-transform: capitalize;

    ${({ $disabled }) => $disabled && 'opacity: 0.5;'}
    ${({ $variant }) => {
        switch ($variant) {
            case 'primary':
                return css`
                    background: #126537;
                    color: white;
                `;
            case 'secondary':
                return css`
                    background: black;
                    color: #ffffff;
                `;
            case 'error':
                return css`
                    background: rgba(255, 54, 54, 0.75);
                    color: #ffffff;
                `;
            default:
                return css`
                    background: #00ff00;
                    color: #000000;
                `;
        }
    }}

    ${({ $size }) => {
        switch ($size) {
            case 'small':
                return css`
                    padding: 1px 12px;
                    font-size: 12px;
                    line-height: 26px;
                `;
            case 'medium':
                return css`
                    padding: 8px 24px;
                    font-size: 12px;
                    line-height: 26px;
                `;
            case 'large':
                return css`
                    padding: 12px 24px;
                    font-size: 14px;
                    line-height: 26px;
                `;
            default:
                return css`
                    padding: 1px 12px;
                    font-size: 12px;
                    line-height: 26px;
                `;
        }
    }}
`;
