import styled from 'styled-components';
import * as m from 'motion/react-m';

export const Wrapper = styled(m.div)`
    display: flex;
    align-items: center;
    position: relative;
    justify-content: center;
    gap: 6px;
`;

export const ActionButton = styled(m.button)`
    width: 25px;
    height: 25px;

    display: flex;
    align-items: center;
    justify-content: center;

    position: relative;
    border-radius: 100%;
    border: 1px solid rgba(221, 221, 221, 0.05);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(77px);
    color: #fff;

    svg {
        max-width: 14px;
        max-height: 14px;
    }

    &:disabled {
        opacity: 0.8;
        pointer-events: none;
    }
`;

export const AddressTooltip = styled(m.div)`
    width: 140px;

    display: flex;
    align-items: center;
    justify-content: center;

    background: ${({ theme }) => theme.palette.background.tooltip};
    z-index: 1;

    padding: 10px;
    font-size: 14px;
    font-weight: 500;
    line-height: 116.667%;
    letter-spacing: -0.36px;

    border-radius: 20px;
    box-shadow: 0 3px 25px 0 rgba(0, 0, 0, 0.25);
`;
