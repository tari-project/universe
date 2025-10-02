import * as m from 'motion/react-m';
import styled from 'styled-components';

export const TriggerWrapper = styled.div``;

export const Options = styled(m.div)`
    display: flex;
    width: 100%;
    padding: 10px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    border-radius: 10px;
    background: ${({ theme }) => theme.palette.background.tooltip};
    box-shadow: 0 10px 50px 0 rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(12px);
    z-index: 2;
`;

export const OptionWrapper = styled(m.button)`
    width: 100%;
    display: grid;
    gap: 8px;
    height: 36px;
    padding: 4px 7px;
    align-items: center;
    grid-template-rows: 1fr;
    grid-template-columns: 22px 1fr;
    background-color: ${({ theme }) => theme.palette.background.tooltip};
    border-radius: 8px;
    transition: background-color 0.2s linear;
    &:hover {
        background-color: ${({ theme }) => theme.palette.background.accent};
    }
`;

export const TimerAccent = styled.div`
    color: ${({ theme }) => theme.palette.text.accent};
    position: absolute;
    font-weight: 700;
    font-size: 11px;
    line-height: 1;
    bottom: -3px;
    right: 1px;
    text-align: right;
`;
export const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    svg {
        display: flex;
        max-width: 100%;
    }
`;
export const OptionText = styled.span`
    font-size: 14px;
    line-height: 1.2;
    color: ${({ theme }) => theme.palette.text.primary};
`;

export const ChipWrapper = styled(m.div)`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50px;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    padding: 4px 7px;
    gap: 3px;
    height: 18px;

    svg {
        display: flex;
        max-width: 100%;
    }
`;

export const ChipText = styled.div`
    height: 9px;
    align-items: center;
    display: flex;
    font-size: 10px;
    line-height: 9px;
    font-weight: 600;
`;
