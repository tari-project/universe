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
    overflow-y: auto;
    overflow-anchor: none;
`;

export const FilterWrapper = styled.div`
    display: flex;
    gap: 12px;
    flex-shrink: 0;
`;

export const EmptyText = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    z-index: 1;
    margin-top: 7px;
    background-color: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#fff')};
    color: ${({ theme }) => (theme.mode === 'dark' ? '#fff' : '#000')};
    padding: 8px 20px;
    border-radius: 100px;
    width: max-content;
    max-width: 220px;
    box-shadow: 0 0 115px 0 rgba(0, 0, 0, 0.35);
`;
