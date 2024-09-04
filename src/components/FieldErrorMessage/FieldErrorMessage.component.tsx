import type { FieldError } from 'react-hook-form';

import { FieldsErrors } from './FieldErrorMessage.constants';
import type { FieldErrorMessageProps } from './FieldErrorMessage.types';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

export const getFieldError = (error: FieldError | undefined, t: TFunction<'translation', undefined>) => {
    if (!error) return;

    const messageByType = FieldsErrors[error.type as keyof typeof FieldsErrors];
    if (messageByType) return t(messageByType);

    if (error.message) return error.message;

    return t('field-error-message.invalid');
};

export const FieldErrorMessage = ({ error }: FieldErrorMessageProps) => {
    const { t } = useTranslation('components', { useSuspense: false });
    return <Typography variant="p">{getFieldError(error, t)}</Typography>;
};
