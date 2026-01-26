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
    height: 100%;
    justify-content: flex-end;
`;

export const Wrapper = styled.div`
    border-radius: 20px;
    background: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    padding: 10px;
    display: flex;
    position: relative;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    overflow-y: auto;
    width: 100%;
    gap: 8px;
    height: auto;
    min-height: 100%;
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
    @media (max-height: 652px) {
        gap: 4px;
    }
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

export const WalletErrorWrapper = styled.div`
    position: absolute;
    right: 14px;
    bottom: 14px;
`;

export const TabsWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
    padding-left: 4px;
`;
