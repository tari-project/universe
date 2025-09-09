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

export const Count = styled.div<{ $count: number }>`
    border-radius: 11px;
    background-color: ${({ theme }) => theme.palette.background.accent};
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    line-height: 1;
    width: ${({ $count }) => ($count > 999 ? 'auto' : '22px')};
    height: ${({ $count }) => ($count > 999 ? 'auto' : '22px')};
    font-size: ${({ $count }) => ($count > 999 ? '10px' : '11px')};
`;
