import { m } from 'framer-motion';
import styled from 'styled-components';

export const Wrapper = styled('div')`
    position: relative;
`;

export const Trigger = styled('div')`
    cursor: pointer;
`;

export const Menu = styled(m.div)`
    z-index: 2;
    position: absolute;
    bottom: 100%;
    left: 50%;

    transform: translateX(-50%);

    margin-bottom: 7px;

    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;

    padding: 20px;

    border-radius: 15px;
    background: #fff;
    box-shadow: 0px 2.915px 24.782px 0px rgba(0, 0, 0, 0.25);

    width: 216px;
`;

export const Title = styled('div')`
    color: #000;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 110%;
`;

export const Text = styled('div')`
    color: #797979;
    font-size: 12px;
    font-weight: 500;
    line-height: 116.667%;
`;
