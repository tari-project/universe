import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

export const TriggerWrapper = styled(motion.div)<{ $disabled?: boolean }>`
    width: 100%;
    background: ${({ theme }) => theme.palette.background.paper};
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    ${({ $disabled }) =>
        $disabled &&
        css`
            pointer-events: none;
            opacity: 0.8;
        `}
`;

export const Options = styled(motion.div)<{ $open?: boolean }>`
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    background: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    height: auto;
    transition: all 0.1s ease-in;

    min-width: 220px;
    width: max-content;
    padding: 9px 12px;

    align-items: flex-start;
    gap: 6px;

    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 500;
    letter-spacing: -1px;
    z-index: 2;
`;

export const SelectedOption = styled(motion.div)`
    color: ${({ theme }) => theme.palette.text.primary};
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 18px;
    font-weight: 500;
    height: 36px;
    width: 100%;
    img {
        width: 14px;
        display: flex;
    }
`;

export const OptionLabelWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    img {
        width: 18px;
        display: flex;
    }
`;
export const StyledOption = styled(motion.div)<{ $selected?: boolean }>`
    display: flex;
    font-size: 14px;
    background: ${({ theme }) => theme.palette.background.paper};
    text-transform: uppercase;
    line-height: 1;
    cursor: pointer;
    border-radius: 10px;
    transition: all 0.2s ease-in-out;

    height: 36px;
    padding: 13px 7px;
    justify-content: space-between;
    align-items: center;
    align-self: stretch;
    background: ${({ theme, $selected }) => ($selected ? theme.palette.colors.darkAlpha[5] : 'none')};

    &:hover {
        background: ${({ theme }) => theme.palette.colors.darkAlpha[10]};
    }
`;

export const IconWrapper = styled.div`
    display: flex;
    width: 21px;
    height: 21px;
    align-items: center;
    justify-content: center;
    border-radius: 100%;
    background: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};

    svg {
        width: 100%;
        height: 100%;
        color: ${({ theme }) => theme.palette.text.primary};
    }
`;
