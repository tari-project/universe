import styled from 'styled-components';

export const ActionContentWrapper = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: center;
    width: 100%;
`;
export const ActionButton = styled.button`
    display: flex;
    align-items: center;
    width: 100%;
`;
export const ButtonIconWrapper = styled.div`
    width: 30px;
    height: 30px;
    color: ${({ theme }) => theme.palette.contrast};
    background-color: ${({ theme }) => theme.palette.base};
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    svg {
        width: 18px;
        max-width: 100%;
        display: flex;
    }
`;
export const SelectWrapper = styled.div`
    padding: 0 20px;
    justify-content: space-between;
    display: flex;
    width: 100%;
`;
