import styled from 'styled-components';

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
    background: ${({ theme }) => theme.palette.background.paper};
    width: 100%;
    height: 100%;
`;

export const SelectTrigger = styled.div`
    display: flex;
    width: 100%;
    flex: 1 1 auto;
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
    background: ${({ theme }) => theme.palette.background.paper};
    padding: 8px 6px;
    overflow: hidden;
    box-shadow:
        20px 20px 45px rgba(0, 0, 0, 0.15),
        10px 10px 35px rgba(0, 0, 0, 0.25);
`;

export const Row = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    width: 100%;
    gap: 2px;
`;
export const OptionListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 2px;
    overflow-y: auto;
`;

export const StyledOption = styled.div<{ $active?: boolean; $selected?: boolean }>`
    display: flex;
    text-align: center;
    justify-content: center;
    font-size: 16px;
    padding: 2px 4px;
    border-radius: 4px;
    border-width: 2px;
    border-style: solid;
    border-color: ${({ theme, $selected }) =>
        $selected ? theme.colors.teal[theme.mode === 'dark' ? 800 : 200] : 'transparent'};
    background: ${({ theme, $active }) =>
        $active ? theme.colors.teal[theme.mode === 'dark' ? 950 : 100] : theme.palette.background.paper};
    cursor: pointer;
    transition: border-color ease-in-out 0.15s background ease-in-out 0.12s;
`;
