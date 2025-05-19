import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { EditWrapper, StyledTextArea, WarningText } from './edit.styles.ts';
import { IoAlertCircleSharp } from 'react-icons/io5';
import { Typography } from '@app/components/elements/Typography.tsx';

const SEEDWORD_REGEX = /^(([a-zA-Z]+)\s){23}([a-zA-Z]+)$/;

export const Edit = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const { register, setValue, formState, trigger } = useFormContext<{ seedWords: string }>();

    const registerOptions = {
        required: true,
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

            trigger('seedWords');
        },
        [setValue, trigger]
    );

    return (
        <>
            <EditWrapper>
                <StyledTextArea
                    $hasError={!!formState.errors.seedWords}
                    onPaste={handlePaste}
                    placeholder="Enter seed words..."
                    {...register('seedWords', registerOptions)}
                />
                <WarningText>
                    <IoAlertCircleSharp size={14} />
                    <Typography>{t('action-requires-restart')}</Typography>
                </WarningText>
            </EditWrapper>
        </>
    );
};
