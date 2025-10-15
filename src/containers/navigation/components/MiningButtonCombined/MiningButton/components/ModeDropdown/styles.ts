import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ $isSecondary?: boolean }>`
    position: relative;
    width: 100%;
    max-width: 200px;
    flex-shrink: 0;

    ${({ $isSecondary }) =>
        $isSecondary &&
        css`
            width: 100%;
            flex: 1 1 auto;
        `}
`;

export const Trigger = styled.button<{ $isOpen: boolean; $isSecondary?: boolean }>`
    flex-shrink: 0;

    width: 100%;
    height: 45px;
    padding: 9px 15px;

    border-radius: 70px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(240, 241, 240, 0.75);
    backdrop-filter: blur(5px);

    transition: background 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);

    &:hover {
        background: rgba(240, 241, 240, 1);
    }

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            background: rgba(240, 241, 240, 1);
        `}

    ${({ $isSecondary }) =>
        $isSecondary &&
        css`
            width: 100%;
            height: 100%;
            flex: 1 1 auto;
            align-items: baseline;
            border-radius: 10px;
            ${TextGroup} {
                height: 100%;
                justify-content: space-between;
            }

            ${IconWrapper} {
                top: 75%;
            }
        `}
`;

export const TextGroup = styled.div`
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 100%;
    gap: 1px;
`;

export const Eyebrow = styled.div`
    color: #797979;
    display: flex;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    line-height: 1;
`;

export const SelectedValue = styled.div`
    color: #000;
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: 1;

    display: flex;
    align-items: center;
    gap: 5px;

    .option-icon {
        width: auto;
        height: 16px;
    }
`;

export const IconWrapper = styled.div<{ $isOpen: boolean }>`
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);

    transition: transform 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);
    transform-origin: center;

    display: flex;
    align-items: center;
    justify-content: center;

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            transform: translateY(-50%) scaleY(-1);
        `}
`;

export const FloatingWrapper = styled.div`
    position: absolute;
    z-index: 10;
`;

export const Menu = styled(m.div)`
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    border-radius: 10px;
    box-shadow: 0 16px 30px 0 rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(12px);

    width: 197px;
    padding: 10px;
    gap: 4px;
    background: ${({ theme }) => theme.palette.background.tooltip};
`;

export const Option = styled.button<{ $isSelected: boolean; $isActive?: boolean }>`
    border-radius: 10px;
    position: relative;

    color: ${({ theme }) => theme.palette.text.primary};
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;

    display: flex;
    align-items: center;
    gap: 9px;

    width: 100%;
    padding: 8px 7px;

    transition: background 0.1s cubic-bezier(0.39, 0.3, 0.2, 0.87);

    cursor: pointer;

    .selected-icon {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
    }

    background: ${({ theme, $isSelected }) => ($isSelected ? theme.palette.action.background.default : 'none')};

    &:hover {
        background: ${({ theme }) => theme.palette.action.hover.default};
    }

    &:focus {
        background: ${({ theme }) => theme.palette.action.hover.default};
        outline: 2px solid ${({ theme }) => theme.palette.focusOutline};
        outline-offset: -2px;
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.palette.focusOutline};
        outline-offset: -2px;
    }

    ${({ $isActive, theme }) =>
        $isActive &&
        css`
            background: ${theme.palette.action.hover.default};
        `}
`;

export const OptionText = styled.div`
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    width: 100%;
`;

export const OptionIcon = styled.img`
    width: 18px;
    flex-shrink: 0;
`;
