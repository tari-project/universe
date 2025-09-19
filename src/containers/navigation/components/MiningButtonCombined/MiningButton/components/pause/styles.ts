import * as m from 'motion/react-m';
import styled from 'styled-components';

export const TriggerWrapper = styled.div``;

export const Options = styled(m.div)`
    display: flex;
    width: 100%;
    padding: 10px;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    border-radius: 10px;
    background: ${({ theme }) => theme.palette.background.paper};
    box-shadow: 0 10px 50px 0 rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(12px);
    z-index: 2;
`;

export const OptionWrapper = styled(m.div)`
    width: 100%;
    display: grid;
    gap: 8px;
    padding: 6px 7px;
    align-items: center;
    grid-template-rows: 1fr;
    grid-template-columns: 22px 1fr;
`;

export const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        display: flex;
        max-height: 100%;
    }
`;
export const OptionText = styled.span`
    font-size: 14px;
    color: ${({ theme }) => theme.palette.text.primary};
`;
