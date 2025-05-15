import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { EditWrapper, StyledTextArea, WarningText } from './edit.styles.ts';

const SEEDWORD_REGEX = /^(([a-zA-Z]+)\s){23}([a-zA-Z]+)$/;

export const Edit = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const { register, setValue, formState } = useFormContext<{ seedWords: string }>();

    const registerOptions = {
        pattern: {
            value: SEEDWORD_REGEX,
            message: t('invalid-seed-words'),
        },
    };

    const handlePaste = useCallback(
        (e) => {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            const formattedSeedText = text.trim().replaceAll(', ', ' ').replaceAll(',', ' ').replaceAll('\n', ' ');
            setValue('seedWords', formattedSeedText);
        },
        [setValue]
    );

    return (
        <>
            <EditWrapper>
                <WarningText>{t('action-requires-restart')}</WarningText>
                <StyledTextArea
                    $hasError={!!formState.errors.seedWords}
                    onPaste={handlePaste}
                    {...register('seedWords', registerOptions)}
                />
            </EditWrapper>
        </>
    );
};
