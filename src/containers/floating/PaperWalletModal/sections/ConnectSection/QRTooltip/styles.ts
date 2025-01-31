import { m } from 'motion';
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
    top: 100%;
    left: 50%;

    transform: translateX(-50%);

    margin-top: 7px;

    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 8px;

    padding: 22px;

    border-radius: 15.306px;
    background: #fff;
    box-shadow: 0px 2.915px 24.782px 0px rgba(0, 0, 0, 0.25);

    width: 190px;
`;

export const Image = styled('img')`
    width: 146px;
    display: block;
`;

export const Text = styled('div')`
    color: #000;
    text-align: center;
    font-size: 14.577px;
    font-weight: 600;
    line-height: 99.7%;
`;
