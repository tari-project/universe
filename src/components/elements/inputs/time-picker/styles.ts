import styled, { css } from 'styled-components';

export const Container = styled.div`
    display: flex;
    flex: 1 1 auto;
    width: 100%;
`;

export const LabelWrapper = styled.div`
    display: flex;
    color: #797979;
    font-size: 12px;
    font-weight: 500;
    padding: 9px 15px;
`;
export const InputWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 18px;
    font-weight: 600;
`;

export const Wrapper = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    z-index: 1;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    background: ${({ theme }) => theme.palette.background.default};
    width: 100%;
    height: 100%;
`;

export const SelectTrigger = styled.div`
    display: flex;
    width: 100%;
    flex: 1 1 auto;
`;

export const IconWrapper = styled.div<{ $isOpen?: boolean }>`
    transition: transform 0.3s cubic-bezier(0.39, 0.3, 0.2, 0.87);
    transform-origin: center;

    display: flex;
    align-items: center;
    justify-content: center;

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            transform: scaleY(-1);
        `}
`;
export const TriggerContent = styled.div`
    width: 100%;
    display: flex;
    padding: 0 15px;
    align-items: center;
    justify-content: space-between;
`;

export const SelectWrapper = styled.div`
    display: flex;
    flex: 1 1 auto;
    width: 100%;
    border-radius: 10px;
    background: ${({ theme }) => theme.palette.background.default};
    padding: 6px;
    overflow: hidden;
    box-shadow:
        20px 20px 45px rgba(0, 0, 0, 0.15),
        10px 10px 35px rgba(0, 0, 0, 0.25);
`;

export const Row = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    width: 100%;
    gap: 4px;
`;
export const OptionListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 2px;
    gap: 4px;
    overflow-y: auto;
`;

export const StyledOption = styled.div<{
    $active?: boolean;
    $selected?: boolean;
    $borderColour?: string;
    $activeColour?: string;
}>`
    display: flex;
    text-align: center;
    justify-content: center;
    font-size: 16px;
    padding: 2px;
    border-radius: 5px;
    border-width: 2px;
    border-style: solid;
    border-color: ${({ $selected, $borderColour }) => ($selected ? $borderColour : 'transparent')};
    background: ${({ theme, $active, $activeColour }) => ($active ? $activeColour : theme.palette.background.default)};
    cursor: pointer;
    transition: border-color ease-in-out 0.15s background ease-in-out 0.2s;
`;
