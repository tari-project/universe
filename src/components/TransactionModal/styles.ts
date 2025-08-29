import styled from 'styled-components';

export const BoxWrapper = styled.div`
    width: 100%;
    height: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 20px;
    padding: 10px;
    position: relative;
`;

export const TopButton = styled('button')`
    cursor: pointer;

    transition: transform 0.2s ease;
    height: 31px;

    &:hover {
        transform: scale(1.1);
    }
`;

export const TopWrapper = styled('div')`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    ${({ theme }) => (theme.mode === 'dark' ? `#fff` : `#000`)};
`;

export const Title = styled('div')`
    font-family: Poppins, sans-serif;
    font-size: 18px;
    font-style: normal;
    font-weight: 600;
    line-height: 31px;
`;
