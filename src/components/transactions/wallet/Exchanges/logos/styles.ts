import styled, { css } from 'styled-components';

interface Props {
    $variant: 'primary' | 'mini';
}
export const Wrapper = styled.div<Props>`
    position: relative;
    height: ${({ $variant }) => ($variant === 'primary' ? `33px` : '20px')};
    width: ${({ $variant }) => ($variant === 'primary' ? `70px` : '40px')};
`;
export const Logo = styled.div<Props & { $index: number; $bgColour?: string }>`
    overflow: hidden;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    z-index: ${({ $index }) => $index + 1};
    top: 0;
    img {
        width: 100%;
    }

    ${({ $variant, $index }) => {
        switch ($variant) {
            case 'mini': {
                return css`
                    width: 24px;
                    height: 24px;
                    right: ${`${$index * 13}px`};
                `;
            }
            case 'primary':
            default:
                return css`
                    width: 33px;
                    height: 33px;
                    border: 2px solid #fff;
                    left: ${`${$index * 15}px`};
                `;
        }
    }}
`;
