import styled from 'styled-components';

interface TabHeaderProps {
    $active: boolean;
}

export const TabsContainer = styled.div`
    width: 800px;
    height: 600px;
`;

export const TabHeaders = styled.div`
    display: flex;
    justify-content: space-around;
`;

export const TabHeader = styled.div<TabHeaderProps>`
    padding: 10px 20px;
    cursor: pointer;
    font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
    border-bottom: ${({ theme, $active }) => ($active ? `2px solid ${theme.palette.primary.main}` : 'none')};
    color: ${({ theme, $active }) => ($active ? theme.palette.primary.main : theme.palette.text.primary)};
    width: 100%;
    text-align: center;
    font-family: Poppins, sans-serif;
    font-size: 15px;

    &:hover {
        background-color: ${({ theme }) => theme.palette.action.hover};
    }
`;

export const TabContent = styled.div`
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
    padding: 20px 0;
`;
