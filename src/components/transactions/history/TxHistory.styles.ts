import styled from 'styled-components';

export const ListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
    width: 100%;
    position: relative;

    h6 {
        text-align: center;
        border: 1px solid pink;
    }
`;

export const ListItemWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    position: relative;
    gap: 10px;
`;
