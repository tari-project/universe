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
    height: 565px;

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
        height: 380px;
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

export const WalletActionWrapper = styled(m.div)`
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    width: 100%;
    height: auto;

    will-change: height;
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
    height: 210px;

    ${({ $isScrolled }) =>
        $isScrolled &&
        css`
            height: 141px;
        `}

    @media (max-height: 690px) {
        padding: 8px 10px;
    }
`;

const spin = keyframes`
  100% {
    transform: translate(-50%, -50%)  rotate(-360deg);
  }
`;

export const AnimatedBG = styled.div<{ $col1: string; $col2: string }>`
    background-image: ${({ $col1, $col2 }) => `linear-gradient(15deg, #000 -10%, ${$col1} 0%, ${$col2} 90%)`};
    position: absolute;
    top: 50%;
    left: 50%;
    width: 400px;
    height: 400px;
    transform: translate(-50%, -50%);
    animation: ${spin} 15s linear infinite;
    z-index: 0;
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

    &:hover {
        opacity: 0.9;
    }
`;
