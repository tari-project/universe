import styled from 'styled-components';

export const TriggerWrapper = styled.div`
    width: 14px;
    height: 14px;
    background: ${({ theme }) => theme.palette.colors.darkAlpha[10]};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 100%;
`;
