import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: center;
    width: 100%;

    padding: 0px 0px 20px 30px;

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

    padding-right: 60px;
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
