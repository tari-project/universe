import styled, { css } from 'styled-components';

export const ListMask = styled.div<{ $bottom?: boolean }>`
    background: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    mask-image: ${({ $bottom }) =>
        `linear-gradient(to ${$bottom ? 'top' : 'bottom'}, black 0px, black 10px, black calc(100% - 40px), transparent 100%)`};
    mask-size: 60% 100%;
    display: flex;
    height: 35px;
    width: 100%;
    position: absolute;
    z-index: 3;
    mask-position: top;
    pointer-events: none;
    top: 0;
    bottom: unset;
    ${({ $bottom }) =>
        $bottom &&
        css`
            mask-position: bottom;
            bottom: -8px;
            top: unset;
        `};
`;

export const ListWrapper = styled.div`
    display: flex;
    position: relative;
    overflow: hidden;
    flex: 1 1 fit-content;
    h6 {
        text-align: center;
    }
`;

export const ListItemWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: auto;
    width: 100%;
    position: relative;
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
