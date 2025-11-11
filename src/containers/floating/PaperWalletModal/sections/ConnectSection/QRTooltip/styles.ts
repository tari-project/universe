import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled('div')`
    position: relative;
`;

export const Trigger = styled('div')`
    height: 44px;
    cursor: pointer;
`;

export const Menu = styled(m.div)`
    width: 190px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 22px;
    background: #fff;
    border-radius: 15px;
    box-shadow: 0 3px 25px 0 rgba(0, 0, 0, 0.25);
`;

export const Image = styled('img')`
    width: 146px;
    display: block;
`;

export const Text = styled('div')`
    color: #000;
    text-align: center;
    font-size: 15px;
    font-weight: 600;
    line-height: 99.7%;
`;
