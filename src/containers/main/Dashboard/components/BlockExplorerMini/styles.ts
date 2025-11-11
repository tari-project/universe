import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    padding: 0 0 10px 20px;
    gap: 16px;
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 0;

    pointer-events: all;
`;

export const InsideHolder = styled.div`
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    position: relative;
`;

export const StickyEntryWrapper = styled.div`
    display: flex;
    align-items: center;
    z-index: 10;
`;

export const LoadingPlaceholder = styled.div`
    width: 100%;
    height: 89px;
`;
