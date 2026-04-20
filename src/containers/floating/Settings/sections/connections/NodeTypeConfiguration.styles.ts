import styled from 'styled-components';
import { StyledInput as BaseStyledInput } from '@app/components/elements/inputs/Input.styles.ts';

export const AddressFieldWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
`;

export const AddressFieldLabel = styled.label`
    font-size: 12px;
    opacity: 0.7;
`;

export const AddressInput = styled(BaseStyledInput)`
    font-size: 13px;
`;

export const AddressErrorMessage = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.palette.error.main};
    margin-top: 2px;
`;
