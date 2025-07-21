import styled from 'styled-components';

export const OuterWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow: hidden;
`;

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    position: relative;
`;

export const Inside = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    padding-bottom: 60px;
    position: relative;
`;

export const ListGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
    padding-bottom: 10px;
`;
