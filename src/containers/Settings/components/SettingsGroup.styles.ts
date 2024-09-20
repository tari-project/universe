import styled from 'styled-components';

export const SettingsGroupWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
    padding: 20px 0;
    justify-content: center;
    gap: 10px;
`;
export const SettingsGroup = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    position: relative;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const SettingsGroupTitle = styled.div`
    display: flex;
    color: ${({ theme }) => theme.palette.text.primary};
`;
export const SettingsGroupContent = styled.div`
    display: flex;
    gap: 4px;
    flex-direction: column;
    width: 100%;
`;
export const SettingsGroupAction = styled.div`
    display: flex;
    font-size: 12px;
`;

export const SettingsGroupTextAction = styled.div`
    display: flex;
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.palette.text.secondary};
    cursor: pointer;
    &:hover {
        text-decoration: underline;
    }
`;
