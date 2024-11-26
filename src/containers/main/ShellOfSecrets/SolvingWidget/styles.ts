import styled from 'styled-components';

export const Wrapper = styled('div')`
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

    border-radius: 10px;
    overflow: hidden;
`;

export const JewelImage = styled('img')`
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%) rotate(-90deg);
    z-index: 3;
    margin-right: -16px;
`;

export const GateImage = styled('img')`
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    z-index: 2;
`;
