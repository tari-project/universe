import styled from 'styled-components';

export const SettingsGroup = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
    gap: 10px;
    padding: 20px 0;
`;

export const SettingsGroupTitle = styled.div`
    display: flex;
`;
export const SettingsGroupContent = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;
export const SettingsGroupAction = styled.div`
    display: flex;
`;
