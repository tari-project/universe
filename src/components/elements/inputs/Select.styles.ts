import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ $disabled?: boolean }>`
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

export const StyledSelect = styled.div`
    display: flex;
    flex-direction: column;
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 500;
    position: relative;
    letter-spacing: -1px;
`;

export const Options = styled.div<{ $open?: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    position: absolute;
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    background: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    z-index: 100;
    height: ${({ $open }) => ($open ? 'auto' : 0)};
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
    transition: all 0.1s ease-in;

    left: 0;
    top: 100%;
    transform: translate(-10px, 10px); // TODO: check bounding box stuff or use react popover

    min-width: 220px;
    padding: 9px 12px;

    align-items: flex-start;
    gap: 6px;
`;

export const SelectedOption = styled.div<{ $selected?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-size: 15px;
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
export const StyledOption = styled.div<{ $selected?: boolean }>`
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
