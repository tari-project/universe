import styled from 'styled-components';
import backgroundImage from '../images/friend_accepted_bg.png';
import { m } from 'framer-motion';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 100%;
    height: 100%;
`;

export const Number = styled(m.div)`
    color: #fff;
    text-align: center;
    font-family: Druk, sans-serif;
    font-size: 38px;
    font-weight: 700;

    position: relative;
    z-index: 2;

    text-shadow: 0px 0px 20px rgba(0, 0, 0, 0.8);
`;

export const Text = styled(m.div)`
    color: #fff;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.36px;

    text-align: center;

    position: relative;
    z-index: 2;

    text-shadow: 0px 0px 20px rgba(0, 0, 0, 0.8);
`;

export const TextBottomPosition = styled('div')`
    position: absolute;
    z-index: 2;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
`;

export const TextBottom = styled(m.div)`
    color: #fff;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.36px;

    text-align: center;
    z-index: 2;

    text-shadow: 0px 0px 20px rgba(0, 0, 0, 0.8);
`;

export const Background = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;

    background-color: #2a3342;
    background-image: url(${backgroundImage});
    background-size: cover;
    background-position: center;
`;
