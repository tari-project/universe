import styled, { css } from 'styled-components';

export const WalletActionButton = styled.button<{
    $disabled?: boolean;
    $variant?: 'primary' | 'secondary' | 'error' | 'success';
    $size?: 'small' | 'medium' | 'large' | 'xl';
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

    ${({ $variant }) => {
        switch ($variant) {
            case 'success':
                return css`
                    background: #126537;
                    color: white;
                `;
            case 'primary':
                return css`
                    background: #523df1;
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
                    padding: 2px 24px;
                    font-size: 12px;
                    line-height: 26px;
                `;
            case 'large':
                return css`
                    width: 100%;
                    padding: 12px 24px;
                    font-size: 14px;
                    line-height: 26px;
                `;
            case 'xl':
                return css`
                    width: 100%;
                    padding: 17px 24px;
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

    ${({ $disabled }) =>
        $disabled &&
        css`
            background: rgba(0, 0, 0, 0.5);
            opacity: 0.5;
        `}
`;
