import styled from 'styled-components';

export const BoxWrapper = styled.div`
    width: 100%;
    height: 100%;
    max-width: clamp(480px, 48vw, 680px);
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 10px 10px 10px;
    position: relative;
    overflow-y: auto;
`;

export const TopButton = styled.button`
    cursor: pointer;
    transition: transform 0.2s ease;
    height: 31px;

    &:hover {
        transform: scale(1.1);
    }
`;

export const TopWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 5px 0 10px 0;
    ${({ theme }) => theme.palette.base};
`;

export const Title = styled.div`
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
`;
