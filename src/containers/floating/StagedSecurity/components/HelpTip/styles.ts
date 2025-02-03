import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    position: absolute;
    top: 30px;
    left: 380px;
    z-index: 1;

    border-radius: 10px;
    background: #fff;
    box-shadow: 0px 4px 45px 0px rgba(0, 0, 0, 0.08);

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    padding: 20px;
    width: 216px;
    pointer-events: all;
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
    font-style: normal;
    font-weight: 500;
    line-height: 116.667%;
`;

export const TextButton = styled('button')`
    color: #000;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 116.667%;
    text-decoration-line: underline;

    display: inline-flex;
    cursor: pointer;
`;
