import * as m from 'motion/react-m';
import styled, { css, keyframes } from 'styled-components';

export const SwapsWrapper = styled(m.div)`
    display: flex;
    height: 100%;
    justify-content: flex-end;
`;
export const WalletWrapper = styled(m.div)`
    width: 100%;
    flex-direction: column;
    display: flex;
    position: relative;
`;

export const Wrapper = styled.div<{ $swapsPanel?: boolean; $seedlessUI?: boolean }>`
    border-radius: 20px;
    background: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    padding: 11px;
    display: flex;
    position: relative;
    flex-direction: column;
    overflow: hidden;
    max-height: 100%;
    overflow-y: auto;
    width: 100%;
    gap: 8px;
    height: 545px;

    @media (max-height: 815px) {
        height: 425px;
        padding: 10px;

        ${({ $swapsPanel, $seedlessUI }) =>
            ($swapsPanel || $seedlessUI) &&
            css`
                height: auto;
            `};
    }
    @media (max-height: 690px) {
        height: 360px;
        ${({ $swapsPanel, $seedlessUI }) =>
            ($swapsPanel || $seedlessUI) &&
            css`
                height: auto;
            `};
    }

    ${({ $swapsPanel, $seedlessUI }) =>
        ($swapsPanel || $seedlessUI) &&
        css`
            height: auto;
        `};
`;

export const DetailsCard = styled(m.div)<{ $isScrolled: boolean; $isWalletFailed?: boolean }>`
    display: flex;
    border-radius: 20px;
    padding: 14px;
    width: 100%;

    box-shadow: 10px 10px 40px 0 rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;
    cursor: ${({ $isWalletFailed }) => ($isWalletFailed ? 'pointer' : 'default')};

    transition: height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: height;
    height: 170px;

    ${({ $isWalletFailed, theme }) =>
        $isWalletFailed &&
        css`
            border: 2px solid ${theme.palette.error.main || '#e03244'};
            background: ${theme.palette.error.main || '#e03244'}0A;
            box-shadow: 0 0 20px ${theme.palette.error.main || '#e03244'}33;

            &:hover {
                box-shadow: 0 0 30px ${theme.palette.error.main || '#e03244'}66;
                border-color: ${theme.palette.error.main || '#e03244'};
                transition: all 0.2s ease;
            }
        `}

    @media (max-height: 700px) {
        height: 140px;
    }

    ${({ $isScrolled }) =>
        $isScrolled &&
        css`
            height: 100px;

            @media (max-height: 700px) {
                height: 100px;
            }
        `}
`;

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

export const DetailsCardBottomContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;
export const DetailsCardContent = styled.div`
    justify-content: space-between;
    flex-direction: column;
    display: flex;
    position: relative;
    width: 100%;
`;

export const BuyTariButton = styled.button`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 13px;
    line-height: 100%;
    text-align: center;
    padding: 0 16px;
    border-radius: 72px;
    background: #000;
    color: #fff;
    cursor: pointer;
    height: 45px;
    transition: all 0.2s ease-in-out;
    flex-shrink: 0;

    span {
        transition: transform 0.2s ease-in-out;
    }

    &:hover {
        span {
            transform: scale(1.075);
        }
    }

    &:active {
        span {
            transform: scale(1);
        }
    }
`;

export const WalletErrorMessage = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
`;

export const WalletErrorTitle = styled.div`
    color: ${({ theme }) => theme.palette.error.main || '#e03244'};
    font-family: Poppins, sans-serif;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
`;

export const WalletErrorSubtitle = styled.div`
    color: ${({ theme }) => theme.palette.error.main || '#e03244'};
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-weight: 400;
    opacity: 0.8;
    line-height: 1.2;
`;

export const TabsWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
    padding-left: 4px;
`;
