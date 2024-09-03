import { keyframes, styled } from '@mui/material/styles';
import { IconCircle } from '../AirdropLogin/ConnectButton/styles';
import { motion } from 'framer-motion';

export const Wrapper = styled(motion.div)`
    padding-top: 14px;
    position: absolute;
    top: 100%;
    right: 0;
    width: 311px;
`;

export const ContentBox = styled('div')`
    width: 100%;

    border-radius: 20px;
    background: linear-gradient(180deg, #c9eb00 32.79%, #fff 69.42%);
    box-shadow: 15.55px 15.55px 42.763px 0px rgba(0, 0, 0, 0.1);

    padding: 20px 10px;

    display: flex;
    flex-direction: column;

    pointer-events: all;
`;

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 10px;

    max-width: 276px;
    margin: 0 auto;
    margin-bottom: 20px;
`;

export const Title = styled('div')`
    color: #000;

    text-align: center;
    font-family: 'DrukWideLCGBold', sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 800;
    line-height: 99.7%;
    text-transform: uppercase;
`;

export const Text = styled('div')`
    color: #000;
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 120.7%;
`;

export const ButtonWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const ConnectButton = styled('button')`
    outline: none;
    border: none;
    cursor: pointer;

    border-radius: 50px;
    background: #000;
    box-shadow: 15.55px 15.55px 42.763px 0px rgba(0, 0, 0, 0.1);
    height: 45px;

    color: #c9eb00;
    text-align: center;
    font-family: 'DrukWideLCGBold', sans-serif;
    font-size: 11.663px;
    font-style: normal;
    font-weight: 800;
    line-height: 99.7%;
    text-transform: uppercase;

    position: relative;

    span {
        display: inline-flex;
        transition: transform 0.2s ease;
    }

    &:hover {
        span {
            transform: scale(1.05);
        }
    }
`;

export const StyledIconCircle = styled(IconCircle)`
    position: absolute;
    top: 8px;
    right: 8px;
`;

export const LaterButton = styled('button')`
    outline: none;
    border: none;
    cursor: pointer;

    background: transparent;

    color: #000;
    text-align: center;
    font-size: 9.33px;
    font-style: normal;
    font-weight: 800;
    line-height: 99.7%;
    text-transform: uppercase;

    display: inline-block;
    width: auto;
    align-self: center;

    &:hover {
        text-decoration: underline;
    }
`;

export const GemsWrapper = styled('div')`
    position: relative;
    aspect-ratio: 184 / 114;
    width: 184px;
    margin: auto;
    margin-bottom: 14px;
`;

const float = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-5px) rotate(2.5deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
`;

export const Gem1 = styled('img')`
    position: absolute;
    top: 6px;
    left: 0;

    animation: ${float} 3s ease-in-out infinite;
`;

export const Gem2 = styled('img')`
    position: absolute;
    bottom: 0;
    right: 18px;
    width: 70px;

    rotate: 43deg;

    animation: ${float} 3.2s ease-in-out infinite;
`;

export const Gem3 = styled('img')`
    position: absolute;
    top: 10px;
    right: 40px;
    width: 28px;

    rotate: 4deg;

    animation: ${float} 3.8s ease-in-out infinite;
`;
