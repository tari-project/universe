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

export const FilterWrapper = styled.div`
    display: flex;
    gap: 12px;
`;
export const FilterCTA = styled.button<{ $isActive?: boolean }>`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 11px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.33px;
    text-transform: capitalize;
    transition: opacity.2s ease-in-out;
    border-radius: 10px;
    opacity: ${({ $isActive }) => ($isActive ? 1 : 0.5)};
    &:hover {
        opacity: 0.7;
    }
`;
