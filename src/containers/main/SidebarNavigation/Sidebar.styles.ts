import styled from 'styled-components';

export const SidebarGrid = styled.div`
    gap: 8px;
    display: grid;
    height: 100%;
    place-items: center stretch;
    align-content: space-between;
    grid-template-columns: auto;
    grid-template-rows: auto [row2-end row4-start] auto;
    grid-template-areas:
        'top top top'
        '. . .'
        'bottom bottom bottom ';
`;

export const GridAreaTop = styled.div`
    grid-area: top;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const GridAreaBottom = styled.div`
    grid-area: bottom;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;
