import styled, { css } from 'styled-components';
import * as m from 'motion/react-m';

export const WalletDisplayWrapper = styled.div`
    background-color: ${({ theme }) => theme.palette.background.splash};
    border-radius: 20px;
    padding: 15px;
    display: flex;
    flex-direction: column;
`;

export const XCInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 14px;
`;
export const HeaderSection = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;
export const ImgWrapper = styled.div<{ $isLogo?: boolean; $border?: boolean }>`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.palette.text.primary};
    img,
    svg {
        display: flex;
        width: 100%;
        max-width: 30px;
    }

    ${({ $isLogo }) =>
        $isLogo &&
        css`
            background-color: ${({ theme }) => theme.colors.greyscale[100]};
        `}

    ${({ $border }) =>
        $border &&
        css`
            border: 1px solid ${({ theme }) => theme.colorsAlpha.greyscaleAlpha[50]};
        `}
`;

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
export const AddressWrapper = styled(m.div)<{ $isOpen: boolean }>`
    overflow: hidden;
`;

export const AddressDisplay = styled.div`
    border-radius: 20px;
    color: ${({ theme }) => theme.palette.text.contrast};
    background: ${({ theme }) => theme.colors.greyscale[100]};
    box-shadow: 0 4px 74px 0 rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(27px);
    padding: 10px;
    margin: 10px 0 0;
    align-items: center;
    justify-content: center;
    display: flex;
`;
