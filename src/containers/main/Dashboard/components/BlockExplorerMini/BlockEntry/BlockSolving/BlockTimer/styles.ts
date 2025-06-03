import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled(m.div)`
    display: flex;
    justify-content: center;
    align-items: center;

    border-radius: 100px;
    background: #fff;

    padding: 0px 7px;
    height: 20px;

    color: #030303;
    font-family: Poppins, sans-serif;
    font-size: 11px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;

    width: fit-content;
    min-width: 46px;

    span {
        transform: translateY(0.5px);
    }
`;
