import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    z-index: 1;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    background: ${({ theme }) => theme.palette.background.paper};
    padding: 9px 15px;
    gap: 20px;
    width: 100%;
`;
export const LabelWrapper = styled.div`
    display: flex;
    color: #797979;
    font-size: 12px;
    font-weight: 500;
`;
export const InputWrapper = styled.div`
    display: flex;
    flex-direction: row;

    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 18px;
    font-weight: 600;
`;

export const SelectTrigger = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

export const Row = styled.div`
    display: flex;
    flex-direction: row;
    border-radius: 10px;
    background: ${({ theme }) => theme.palette.background.paper};
    overflow-y: auto;
    justify-content: center;
    padding: 8px 6px;
    gap: 4px;
    box-shadow:
        20px 20px 45px rgba(0, 0, 0, 0.15),
        10px 10px 35px rgba(0, 0, 0, 0.25);
`;
export const OptionListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 2px 4px;
`;

export const Option = styled.div<{ $active?: boolean; $selected?: boolean }>`
    display: flex;
    text-align: center;
    justify-content: center;
    font-size: 16px;
    background: ${({ theme, $active }) =>
        $active ? theme.palette.background.default : theme.palette.background.paper};
    border: 1px solid ${({ theme, $selected }) => ($selected ? theme.palette.background.tooltip : 'transparent')};
`;
