import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled.span`
    position: relative;
    display: inline-block;
`;

export const Trigger = styled.div`
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 16px;

    svg {
        width: 12px;
        height: 12px;
        display: inline-block;
    }

    transform: translateY(2px);
`;

export const TooltipPosition = styled.div`
    z-index: 1000;
    position: absolute;
    top: 100%;
    right: 0;
    transform: translateY(14px);
`;

export const TooltipBox = styled(m.div)`
    box-shadow:
        20px 20px 45px rgba(0, 0, 0, 0.15),
        10px 10px 35px rgba(0, 0, 0, 0.25);

    color: ${({ theme }) => theme.palette.text.primary};
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 116.667%;
    background: ${({ theme }) => theme.palette.background.tooltip};
    border-radius: 10px;
    padding: 10px;

    max-width: 248px;
    width: max-content;
    white-space: normal;
`;
