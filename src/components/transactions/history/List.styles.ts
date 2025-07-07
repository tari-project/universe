import styled from 'styled-components';

export const ListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;

    width: 100%;
    height: 100%;

    h6 {
        text-align: center;
    }
`;

export const ListItemWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    gap: 4px;
`;

export const FilterWrapper = styled.div`
    display: flex;
    gap: 12px;
    flex-shrink: 0;
`;
