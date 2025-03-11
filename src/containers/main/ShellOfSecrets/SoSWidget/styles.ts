import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    position: fixed;
    top: 30px;
    right: 30px;
    z-index: 5;
`;

export const BlackBox = styled('div')`
    position: relative;
    background-color: #181e2c;

    width: 417px;
    height: 208px;
    flex-shrink: 0;
    padding: 10px;

    border-radius: 10px;
    overflow: hidden;
    box-shadow:
        0 10px 25px -12.5px rgba(0, 0, 0, 0.07),
        0 13px 33px -16.66px rgba(0, 0, 0, 0.05),
        0 15px 50px -25px rgba(0, 0, 0, 0.035);

    display: flex;
    align-items: center;
    gap: 20px;

    pointer-events: all;
`;

export const JewelImage = styled('img')`
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%) rotate(-90deg);
    z-index: 3;
    margin-right: -10px;
`;

export const GateImage = styled('img')`
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    z-index: 2;
`;

export const ContentLayer = styled('div')`
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;
    height: 100%;
`;

export const TopGroup = styled('div')`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    width: 100%;
    height: 100%;
    padding: 20px 24px 0 24px;
`;
