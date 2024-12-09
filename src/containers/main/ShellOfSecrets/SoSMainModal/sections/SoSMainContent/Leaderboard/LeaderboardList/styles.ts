import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 6px;

    overflow: hidden;
    overflow-y: auto;

    height: 100px;
    flex-grow: 1;

    position: relative;
    padding-top: 10px;
    padding-bottom: 100px;

    mask-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0) 0px,
        rgba(0, 0, 0, 1) 10px,
        rgba(0, 0, 0, 1) 70%,
        rgba(0, 0, 0, 0.5) 85%,
        rgba(0, 0, 0, 0) 100%
    );
    -webkit-mask-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0) 0px,
        rgba(0, 0, 0, 1) 10px,
        rgba(0, 0, 0, 1) 70%,
        rgba(0, 0, 0, 0.5) 85%,
        rgba(0, 0, 0, 0) 100%
    );
`;
