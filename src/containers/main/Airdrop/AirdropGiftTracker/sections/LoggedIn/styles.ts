import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;

    @media (max-height: 670px) {
        gap: 10px;
    }
`;

export const UserRow = styled('div')`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
`;
