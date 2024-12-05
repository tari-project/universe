import styled from 'styled-components';

export const TappletsGroupWrapper = styled.div<{ $category?: string }>`
display: flex;
    flex-direction: column;
    width: 100%;
    position: relative;
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
    padding-top: 20px;
    margin-top: 10px;
    &:before {
        content: '${({ $category }) => $category || 'Tapplets'}';
        position: absolute;
        background-color: ${({ theme }) => theme.palette.background.paper};
        top: -9px;

        color: ${({ theme }) => theme.palette.primary.light};
        font-size: 12px;
        font-weight: 600;
        line-height: 18px;
        letter-spacing: -0.1px;
        padding-right: 12px;
`;

export const TappletsGroup = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    gap: 6px;
    position: relative;
    color: ${({ theme }) => theme.palette.text.secondary};

    ol,
    ul {
        max-width: 100%;
        padding-inline-start: 30px;
        line-height: 1.3;

        li {
            word-wrap: anywhere;
            &::marker {
                font-weight: 500;
            }
        }
    }
`;

export const TappletsGroupTitle = styled.div`
    display: flex;
    color: ${({ theme }) => theme.palette.text.primary};
    justify-content: space-between;
`;
export const TappletsGroupContent = styled.div`
    display: flex;
    gap: 4px;
    flex-direction: column;
    width: 100%;
`;
export const TappletsGroupAction = styled.div`
    display: flex;
    font-size: 12px;
    gap: 6px;
`;
