import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
`;

export const TriggerWrapper = styled.div<{ $disabled?: boolean; $isBordered?: boolean }>`
    width: 100%;
    background: ${({ theme }) => theme.palette.background.paper};
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    ${({ $isBordered, theme }) =>
        $isBordered &&
        css`
            border-radius: 10px;
            border: 1px solid ${theme.palette.divider};
            background: rgba(0, 0, 0, 0.01);
            padding: 0 15px;
        `}
    ${({ $disabled }) =>
        $disabled &&
        css`
            pointer-events: none;
            opacity: 0.8;
        `}
`;

export const Options = styled.div<{ $open?: boolean; $isBordered?: boolean }>`
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 40px 0 rgba(0, 0, 0, 0.3);
    background: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    height: auto;
    transition: all 0.1s ease-in;
    position: absolute;
    left: ${({ $isBordered }) => ($isBordered ? '0' : '-12px')};
    min-width: 220px;
    width: ${({ $isBordered }) => ($isBordered ? '100%' : 'max-content')};
    padding: 9px 12px;

    align-items: flex-start;
    gap: 6px;

    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 500;
    letter-spacing: -1px;
    z-index: 10;
    max-height: 200px;
    overflow-y: auto;
`;

export const SelectedOption = styled.div<{ $isBordered?: boolean; $forceHeight?: number }>`
    color: ${({ theme }) => theme.palette.text.primary};

    display: flex;
    align-items: center;
    gap: 5px;

    font-size: ${({ $isBordered }) => ($isBordered ? '14px' : '18px')};
    font-weight: 500;

    width: 100%;
    letter-spacing: -0.2px;

    img {
        width: 14px;
        display: flex;
    }

    ${({ $forceHeight }) =>
        $forceHeight &&
        css`
            height: ${$forceHeight}px;
        `}
`;

export const OptionLabelWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    img {
        width: 18px;
        display: flex;
    }
`;
export const StyledOption = styled.div<{ $selected?: boolean; $loading?: boolean }>`
    display: flex;
    font-size: 14px;
    background: ${({ theme }) => theme.palette.background.paper};
    line-height: 1;
    cursor: ${({ $loading }) => ($loading ? 'wait' : 'pointer')};
    border-radius: 10px;
    transition: all 0.2s ease-in-out;

    height: 36px;
    padding: 13px 7px;
    justify-content: space-between;
    align-items: center;
    align-self: stretch;
    background: ${({ theme, $selected }) => ($selected ? theme.palette.action.background.default : 'none')};

    &:hover {
        background: ${({ theme }) => theme.palette.action.hover.default};
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
