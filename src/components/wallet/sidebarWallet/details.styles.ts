import { m } from 'motion/react';
import styled, { css, keyframes } from 'styled-components';

const spin = keyframes`
  100% {
    transform: translate(-50%, -50%)  rotate(-360deg);
  }
`;

export const AnimatedBG = styled.div<{ $col1: string; $col2: string; $isWalletFailed?: boolean }>`
    background-image: ${({ $col1, $col2, $isWalletFailed, theme }) =>
        $isWalletFailed
            ? `linear-gradient(15deg, ${theme.palette.error.main || '#e03244'} 0%, ${theme.palette.error.main || '#e03244'} 100%)`
            : `linear-gradient(15deg, #000 -10%, ${$col1} 0%, ${$col2} 90%)`};
    position: absolute;
    top: 50%;
    left: 50%;
    width: 400px;
    height: 400px;
    transform: translate(-50%, -50%);
    animation: ${({ $isWalletFailed }) => ($isWalletFailed ? 'none' : spin)} 15s linear infinite;
    z-index: 0;
    opacity: ${({ $isWalletFailed }) => ($isWalletFailed ? 0.1 : 1)};
`;
export const DetailsCard = styled(m.div)<{ $isScrolled: boolean }>`
    display: flex;
    border-radius: 20px;
    padding: 14px;
    width: 100%;

    box-shadow: 10px 10px 40px 0 rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;

    transition: height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: height;
    height: 170px;

    @media (max-height: 652px) {
        height: 130px;
        padding: 10px;
    }

    ${({ $isScrolled }) =>
        $isScrolled &&
        css`
            height: 100px;
            @media (max-height: 652px) {
                height: 100px;
            }
        `}
`;

export const Content = styled.div`
    justify-content: space-between;
    flex-direction: column;
    display: flex;
    position: relative;
    width: 100%;
`;

export const BottomContent = styled.div`
    display: flex;
    color: ${({ theme }) => theme.colorsAlpha.lightAlpha[80]};
    flex-direction: column;
    gap: 8px;

    @media (max-height: 652px) {
        gap: 4px;
    }

    p {
        font-size: 10px;
        line-height: 1;
    }
`;

export const WalletErrorWrapper = styled.div`
    position: absolute;
    right: 14px;
    bottom: 14px;
`;
