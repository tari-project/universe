import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';

import { IoCheckmarkOutline, IoCloseOutline } from 'react-icons/io5';
import { useCallback, useEffect } from 'react';
import { useWalletStore } from '@app/store/useWalletStore';
import { Controller, useForm } from 'react-hook-form';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog';
import { Stack } from '@app/components/elements/Stack';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

export interface SeedWordsEditProps {
    toggleEdit: () => Promise<void>;
    seedWords: string[];
    seedWordsFetching: boolean;
}

export const WrapperForm = styled.form(() => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '10px',
}));

export const StyledTextArea = styled.textarea<{ $hasError: boolean }>(({ $hasError, theme }) => ({
    backgroundColor: theme.palette.background.default,
    width: '100%',
    borderRadius: '10px',
    border: `1px solid ${$hasError ? theme.palette.error.main : theme.colorsAlpha.darkAlpha[10]}`,
    padding: '20px',
}));

export const CopyIconContainer = styled.div(({ theme }) => ({
    color: theme.palette.text.primary,
}));

export const ErrorTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.error.main,
    height: '14px',
}));

export const GreyTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    height: '14px',
}));

const seedWordsRegex = /^(([a-zA-Z]+)\s){23}([a-zA-Z]+)$/;

export const SeedWordsEdit = ({ seedWords, seedWordsFetching, toggleEdit }: SeedWordsEditProps) => {
    const importSeedWords = useWalletStore((s) => s.importSeedWords);
    const isWalletImporting = useWalletStore((s) => s.is_wallet_importing);
    const { t } = useTranslation('settings', { useSuspense: false });

    const {
        control,
        watch,
        handleSubmit,
        setValue,
        reset,
        trigger,
        formState: { errors },
    } = useForm({
        defaultValues: { seedWords: seedWords.join(' ') },
    });

    const seedWordsValue = watch('seedWords');

    useEffect(() => {
        trigger('seedWords');
    }, [seedWordsValue, trigger]);

    const handleApply = useCallback(
        async (data: { seedWords: string }) => {
            await importSeedWords(data.seedWords.split(' '));
        },
        [importSeedWords]
    );

    const handleReset = useCallback(() => {
        reset({ seedWords: seedWords.join(' ') });
        toggleEdit();
    }, [reset, seedWords, toggleEdit]);

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
            <GreyTypography variant="p">{t('action-requires-restart')}</GreyTypography>
            <WrapperForm onSubmit={handleSubmit(handleApply)} onReset={handleReset}>
                <Controller
                    name="seedWords"
                    control={control}
                    rules={{
                        pattern: {
                            value: seedWordsRegex,
                            message: t('invalid-seed-words'),
                        },
                    }}
                    render={({ field }) => {
                        const { ref: _ref, ...rest } = field;
                        return (
                            <StyledTextArea
                                $hasError={!!errors.seedWords}
                                disabled={seedWordsFetching}
                                onPaste={handlePaste}
                                {...rest}
                            />
                        );
                    }}
                />
                <CopyIconContainer>
                    {!errors.seedWords && (
                        <IconButton type="submit">
                            <IoCheckmarkOutline />
                        </IconButton>
                    )}
                    <IconButton type="reset">
                        <IoCloseOutline />
                    </IconButton>
                </CopyIconContainer>
            </WrapperForm>
            <ErrorTypography variant="p">{errors.seedWords && errors.seedWords.message}</ErrorTypography>

            <Dialog open={isWalletImporting} onOpenChange={undefined} disableClose={true}>
                <DialogContent>
                    <Stack direction="column" alignItems="center" justifyContent="space-between">
                        <Typography variant="h2">{t('importing-wallet')}</Typography>
                        <CircularProgress />
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
};
