import type { FieldError } from 'react-hook-form';
import Typography from '@mui/material/Typography';

import { FieldsErrors } from './FieldErrorMessage.constants';
import type { FieldErrorMessageProps } from './FieldErrorMessage.types';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export const getFieldError = (error: FieldError | undefined, t: TFunction<'translation', undefined>) => {
    if (!error) return;

    const messageByType = FieldsErrors[error.type as keyof typeof FieldsErrors];
    if (messageByType) return t(messageByType);

    if (error.message) return error.message;

    return t('field-error-message.invalid');
};

export const FieldErrorMessage: React.FC<FieldErrorMessageProps> = ({ error }) => {
    const { t } = useTranslation('components', { useSuspense: false });
    return (
        <Typography color="error" variant="body1" sx={{ width: '100%', display: 'inline-block' }}>
            {getFieldError(error, t)}
        </Typography>
    );
};
