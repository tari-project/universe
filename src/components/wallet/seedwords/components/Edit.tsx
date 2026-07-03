import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { EditWrapper, StyledTextArea } from './edit.styles.ts';

// Matches 24 BIP-39 seed words separated by any run of whitespace (spaces,
// tabs, newlines) or commas, with optional leading/trailing whitespace. Each
// "word" is matched as `[^\s,]+`, i.e. any run of characters that is not a
// separator. The wallet backend supports Japanese, Chinese (Simplified and
// Traditional), Korean, Spanish, French, and Italian BIP-39 wordlists in
// addition to English; a narrower `[a-zA-Z]+` class would reject those
// non-ASCII phrases in the frontend tick even though the backend would
// happily import them. The `u` flag turns on Unicode mode so the engine
// treats the input as a stream of code points rather than UTF-16 code units.
const SEEDWORD_REGEX = /^\s*([^\s,]+)([\s,]+[^\s,]+){23}\s*$/u;

/**
 * Normalize a raw seed-words string into the canonical space-separated form
 * expected by the Tauri backend. Collapses any run of whitespace or commas
 * into a single space and trims the result.
 */
export const normalizeSeedWordsInput = (value: string): string => value.replace(/[\s,]+/g, ' ').trim();

/**
 * Split a raw seed-words string into the clean `string[]` expected by the
 * Tauri `import_seed_words` / `forgot_pin` commands. Accepts any mix of
 * whitespace (spaces, tabs, newlines) and commas as separators and filters
 * out empty tokens so one-word-per-line or comma-separated input parses
 * correctly. See issue #3128.
 */
export const splitSeedWordsInput = (value: string): string[] =>
    value
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean);

export const Edit = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const { register, setValue, formState } = useFormContext<{ seedWords: string }>();

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
            // `setValue` with `shouldValidate: true` already runs the field
            // validator, so an extra `trigger('seedWords')` would just
            // re-validate synchronously. Dropping it keeps the dependency
            // array minimal and avoids a redundant form re-render.
            setValue('seedWords', formattedSeedText, { shouldValidate: true, shouldDirty: true });
        },
        [setValue]
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
