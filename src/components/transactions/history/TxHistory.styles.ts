import styled from 'styled-components';

export const ListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    overflow-y: auto;
    width: 100%;

    flex-grow: 1;
    position: relative;

    mask-image: linear-gradient(to bottom, transparent 0px, black 6px, black calc(100% - 30px), transparent 100%);

    h6 {
        text-align: center;
    }
`;

export const ListItemWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: calc(100% - 4px);
    position: relative;
    gap: 4px;
    padding-top: 6px;
`;
