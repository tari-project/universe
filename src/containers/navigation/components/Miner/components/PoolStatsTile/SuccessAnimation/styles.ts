'use client';

import styled from 'styled-components';
import * as m from 'motion/react-m';

export const Wrapper = styled(m.div)`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
    border-radius: 12px;

    background: linear-gradient(90deg, #5fea9d -34.81%, #b3d891 100%);
`;

export const Text = styled(m.div)`
    position: relative;
    z-index: 10;

    color: #000;
    text-align: center;
    font-family: Poppins, sans-serif;
    font-size: 18px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
`;

export const LottieWrapper = styled(m.div)`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 100%;
    height: 100%;
    z-index: 9;
    overflow: hidden;
    border-radius: 12px;

    .lottie-animation {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scale(1.1);
    }
`;
