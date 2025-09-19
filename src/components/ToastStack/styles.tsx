import { styled } from 'styled-components';

export const Wrapper = styled.div<{ $isSettingUp?: boolean }>`
    position: fixed;
    left: 0;
    bottom: 0;
    z-index: 999;

    width: 100%;
    pointer-events: none;
`;

export const Inside = styled.div`
    position: relative;

    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    width: 100%;
`;
