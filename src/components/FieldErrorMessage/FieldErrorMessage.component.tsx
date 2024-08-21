import type { FieldError } from 'react-hook-form';
import Typography from '@mui/material/Typography';

import { FieldsErrors } from './FieldErrorMessage.constants';
import type { FieldErrorMessageProps } from './FieldErrorMessage.types';

export const getFieldError = (error: FieldError | undefined) => {
    if (!error) return;

    const messageByType = FieldsErrors[error.type as keyof typeof FieldsErrors];
    if (messageByType) return messageByType;

    if (error.message) return error.message;

    return 'Field Invalid';
};

export const FieldErrorMessage: React.FC<FieldErrorMessageProps> = ({
    error,
}) => (
    <Typography
        color="error"
        variant="body1"
        sx={{ width: '100%', display: 'inline-block' }}
    >
        {getFieldError(error)}
    </Typography>
);
