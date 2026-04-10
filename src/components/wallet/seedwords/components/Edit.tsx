import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { EditWrapper, StyledTextArea } from './edit.styles.ts';

// Matches 24 alphabetic words separated by any run of whitespace (spaces,
// tabs, newlines) or commas, with optional leading/trailing whitespace. This
// means validation — and therefore the confirmation tick — works whether the
// user types words separated by spaces, presses Enter between words, or
// pastes a comma-separated list.
const SEEDWORD_REGEX = /^\s*([a-zA-Z]+)([\s,]+[a-zA-Z]+){23}\s*$/;

/**
 * Normalize a raw seed-words string into the canonical space-separated form
 * expected by the Tauri backend. Collapses any run of whitespace or commas
 * into a single space and trims the result.
 */
export const normalizeSeedWordsInput = (value: string): string => value.replace(/[\s,]+/g, ' ').trim();

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
        (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            const formattedSeedText = normalizeSeedWordsInput(text);
            setValue('seedWords', formattedSeedText, { shouldValidate: true, shouldDirty: true });
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
            </EditWrapper>
        </>
    );
};
