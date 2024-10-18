import { Input } from '@app/components/elements/inputs/Input';
import { Typography } from '@app/components/elements/Typography';
import styled from 'styled-components';

export const StyledInput = styled(Input)<{ hasError?: boolean }>(({ theme, hasError }) => ({
    borderColor: hasError ? theme.palette.error.main : theme.palette.colors.darkAlpha[10],
    marginLeft: '15px',
}));

export const ErrorTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.error.main,
    marginLeft: '15px',
    // Prevent jumping when the error message appears
    minHeight: '14px',
}));

export const SaveButtonWrapper = styled.div({
    marginLeft: '15px',
    alignSelf: 'flex-end',
    // Prevent jumping when save available
    minHeight: '36px',
});
