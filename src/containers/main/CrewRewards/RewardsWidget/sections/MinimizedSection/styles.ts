import styled from 'styled-components';
import * as m from 'motion/react-m';

export const Wrapper = styled(m.button)`
    position: relative;
    z-index: 1;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    border-radius: 13px;
    background: #323333;
    box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.25)
        ${({ theme }) => (theme.mode === 'dark' ? '' : ', 0px 0px 3px 2px rgba(242, 216, 255, 0.2) inset')};

    height: 42px;
    cursor: pointer;
    padding: 0 14px 0 12px;

    pointer-events: all;

    * {
        pointer-events: all;
    }

    transition: background 0.2s ease-in-out;

    &:hover {
        background: #424343;
    }
`;

export const IconImage = styled.img`
    width: 23px;
`;

export const Title = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;

    color: #fff;

    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: 129.623%;
`;
