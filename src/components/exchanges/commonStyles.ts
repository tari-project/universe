import styled, { css } from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const OpenButton = styled.button<{ $isOpen?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 100%;
    transition: transform 0.2s ease-in;
    cursor: pointer;
    background: none;
    ${({ $isOpen }) =>
        $isOpen
            ? css`
                  transform: rotate(0deg);
              `
            : css`
                  transform: rotate(-90deg);
              `}
`;

export const ImgWrapper = styled.div<{
    $isLogo?: boolean;
    $border?: boolean;
    $col1?: string;
    $col2?: string;
    $isActive?: boolean;
}>`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.palette.text.primary};
    box-shadow: -2px 1px 32px -7px ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    transition: transform 0.2s ease;
    img,
    svg {
        display: flex;
        max-width: 100%;
    }

    ${({ $isLogo, $col1, theme }) =>
        $isLogo &&
        css`
            background-color: ${$col1 || theme.colors.greyscale[50]};
            color: #c9eb00;
            svg {
                max-width: 70%;
            }
        `}

    ${({ $border }) =>
        $border &&
        css`
            border: 1px solid ${({ theme }) => theme.colorsAlpha.greyscaleAlpha[10]};
        `}
`;

export const CloseButton = styled.button`
    display: flex;
    width: 30px;
    height: 30px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    transition: transform 0.2s ease;
    &:hover {
        transform: scale(1.05);
    }
`;
export const CloseWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: flex-end;
`;

export const ListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-radius: 24px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    width: 100%;
    padding: 20px;
`;
