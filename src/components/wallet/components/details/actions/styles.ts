import styled from 'styled-components';
import * as m from 'motion/react-m';

export const Wrapper = styled(m.div)`
    display: flex;
    align-items: center;
    position: relative;
    justify-content: center;
    gap: 4px;
`;

export const ActionButton = styled.button`
    display: flex;
    width: 25px;
    height: 25px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    position: relative;
    border-radius: 85px;
    border: 1px solid rgba(221, 221, 221, 0.05);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(77px);
    color: #fff;

    svg {
        max-width: 14px;
    }

    &:disabled {
        opacity: 0.8;
        pointer-events: none;
    }
`;

export const AddressTooltip = styled(m.div)`
    width: 140px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 72px;
    background: ${({ theme }) => theme.palette.background.paper};
    z-index: 1;
    font-weight: 600;
`;

export const Menu = styled(m.div)`
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: ${({ theme }) => theme.palette.background.paper};
    z-index: 1;
`;
