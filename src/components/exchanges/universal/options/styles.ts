'use client';

import styled from 'styled-components';

export const ListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-radius: 24px;
    background-color: ${({ theme }) => theme.palette.background.paper};
    width: 100%;
    height: auto;
    max-height: 100%;
    overflow: hidden;
    padding: 20px;

    @media (max-height: 750px) {
        gap: 5px;
    }
`;

export const ScrollWrapper = styled.div`
    flex-direction: column;
    display: flex;
    gap: 12px;
    overflow: hidden;
    overflow-y: auto;

    @media (max-height: 750px) {
        gap: 5px;
    }
`;
