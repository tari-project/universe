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
    width: 33px;
    height: 33px;
    position: absolute;
    left: ${({ $index }) => `${$index * 15}px`};
    z-index: ${({ $index }) => $index + 1};
    top: 0;
    background-color: ${({ theme, $bgColour }) => $bgColour || theme.colors.greyscale[50]};
    img {
        height: 24px;
        width: auto;
    }

    ${({ $variant, $index }) => {
        switch ($variant) {
            case 'mini': {
                return css`
                    width: 20px;
                    height: 20px;
                    left: ${`${$index * 10}px`};
                `;
            }
            case 'primary':
            default:
                return css`
                    width: 33px;
                    height: 33px;
                    left: ${`${$index * 15}px`};
                    border: 2px solid white;
                `;
        }
    }}
`;
