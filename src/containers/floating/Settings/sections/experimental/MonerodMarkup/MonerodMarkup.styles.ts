import { Input } from '@app/components/elements/inputs/Input';
import styled from 'styled-components';

export const StyledInput = styled(Input)<{ hasError?: boolean }>(({ theme, hasError }) => ({
    borderColor: hasError ? theme.palette.error.main : theme.colorsAlpha.darkAlpha[10],
}));

export const NodesSettingsContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    position: relative;
    border-top: 1px solid ${({ theme }) => theme.palette.divider};
    padding-top: 20px;
    margin-top: 10px;
    &:before {
        content: 'Monerod Nodes URLs';
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
