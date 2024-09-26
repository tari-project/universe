import { FaXTwitter } from 'react-icons/fa6';
import styled, { keyframes } from 'styled-components';

const rotateGem1 = keyframes`
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(20deg) scale(1.1);
  }
`;

const rotateGem2 = keyframes`
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(-20deg) scale(1.1);
  }
`;

const rotateGem3 = keyframes`
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(-20deg) scale(1.1);
  }
`;

export const StyledButton = styled('button')`
    padding: 0px 4px 0 8px;

    display: flex;
    align-items: center;
    gap: 10px;

    text-transform: none;
    pointer-events: all;

    border-radius: 70px;
    height: 36px;

    border: 1px solid #000;
    background: #000;
    transition: transform 0.2s ease;
    text-transform: unset;
    position: relative;

    &:hover {
        border: 1px solid #000;
        background: #000;
        transform: scale(1.05);

        .ConnectButton-Gem1 {
            animation: ${rotateGem1} 0.4s ease-in-out;
        }

        .ConnectButton-Gem2 {
            animation: ${rotateGem2} 0.4s ease-in-out;
        }

        .ConnectButton-Gem3 {
            animation: ${rotateGem3} 0.4s ease-in-out;
        }
    }
`;

export const NumberPill = styled('div')`
    color: #fff;
    background: #000;
    font-size: 13px;
    font-weight: 600;

    border-radius: 100px;
    background: linear-gradient(180deg, #ff84a4 0%, #d92958 100%);

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1px;

    min-width: 63px;
    height: 23px;

    padding: 0 8px;

    .StatsIcon-gems {
        transform: translateX(-2px);
    }
`;

export const Text = styled('div')`
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    text-transform: none;
    pointer-events: none;
`;

export const IconCircle = styled('div')`
    background: #fff;
    border-radius: 100%;

    display: flex;
    align-items: center;
    justify-content: center;

    height: 28px;
    width: 28px;
`;

export const XIcon = styled(FaXTwitter)`
    fill: #000;
    width: 15px;
    height: 17px;
    flex-shrink: 0;
`;

export const Gem1 = styled('img')`
    position: absolute;
    top: 1px;
    left: -18px;
    transition: transform 0.2s ease;
`;

export const Gem2 = styled('img')`
    position: absolute;
    top: -9px;
    left: 7px;
    transition: transform 0.2s ease;
`;

export const Gem3 = styled('img')`
    position: absolute;
    top: -15px;
    left: 58px;
    transition: transform 0.2s ease;
`;
