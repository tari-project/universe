import styled from 'styled-components';
import backgroundImage from '../images/goal_complete_bg.png';
import * as m from 'motion/react-m';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    color: #fff;
`;

export const Background = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;

    background-image: url(${backgroundImage});
    background-size: cover;
    background-position: center;
`;

export const IntroBox = styled('div')`
    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;
`;

export const GiftBoxWrapper = styled(m.div)`
    width: 211px;
    height: 149px;
    position: relative;
    z-index: 2;
`;

export const GiftBox = styled(m.img)`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
`;

export const GiftBoxShine = styled(m.img)`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
`;

export const GiftBoxLid = styled(m.img)`
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
`;
