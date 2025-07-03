import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
    width: 100%;
    max-width: 200px;
    flex-shrink: 0;
`;

export const Trigger = styled.button<{ $isOpen: boolean }>`
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
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    line-height: 100%;
`;

export const SelectedValue = styled.div`
    color: #000;
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
    line-height: 100%;

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
    box-shadow: 0px 16px 30px 0px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(12.5px);

    width: 197px;
    padding: 10px;

    background: ${({ theme }) => theme.palette.background.paper};
`;

export const Option = styled.button<{ $isSelected: boolean }>`
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
