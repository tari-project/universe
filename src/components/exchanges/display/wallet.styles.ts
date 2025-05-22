import styled, { css } from 'styled-components';
import * as m from 'motion/react-m';
import { convertHexToRGBA } from '@app/utils';

export const WalletDisplayWrapper = styled.div`
    background-color: ${({ theme }) => theme.palette.background.paper};
    border-radius: 20px;
    padding: 15px 15px 0 15px;
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
    box-shadow: -2px 1px 32px -7px ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};

    img,
    svg {
        display: flex;
        max-width: 100%;
    }

    ${({ $isLogo }) =>
        $isLogo &&
        css`
            background-color: ${({ theme }) => theme.colors.greyscale[50]};
            img {
                max-width: 26px;
            }
        `}

    ${({ $border }) =>
        $border &&
        css`
            border: 1px solid ${({ theme }) => theme.colorsAlpha.greyscaleAlpha[10]};
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
    border-radius: 24px;
    font-weight: 900;
    white-space: nowrap;
    background-color: ${({ theme }) => theme.palette.background.default};
    letter-spacing: 0.1rem;
    padding: 10px 0;
    margin: 10px 0 15px;
    align-items: center;
    justify-content: center;
    display: flex;
`;
