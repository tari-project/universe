import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
`;

export const Inside = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
`;

export const ListGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
`;
