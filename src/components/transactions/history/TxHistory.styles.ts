import styled from 'styled-components';

export const ListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overflow-y: auto;
    width: 100%;
    flex-grow: 1;
    position: relative;

    h6 {
        text-align: center;
    }
`;

export const ListItemWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: calc(100% - 4px);
    padding: 0 2px;
    position: relative;
    gap: 4px;
`;
