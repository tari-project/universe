import styled from 'styled-components';
import * as m from 'motion/react-m';

export const Wrapper = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    height: 100%;

    border-radius: 100%;
    flex-shrink: 0;
    position: relative;
`;

export const Copied = styled(m.div)`
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1;

    background-color: #16d92f;
    color: #fff;
    padding: 2px 8px 1px 8px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 600;
    line-height: 12px;
    text-align: center;
    text-transform: uppercase;
    white-space: nowrap;

    margin-bottom: 0px;
`;
