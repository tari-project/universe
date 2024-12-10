import { SquaredButton } from '@app/components/elements/buttons/SquaredButton';
import { TextArea } from '@app/components/elements/inputs/TextArea';

import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';

import { IoCheckmarkOutline, IoCloseOutline } from 'react-icons/io5';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

export const StyledTextArea = styled(TextArea)<{ $hasError: boolean }>(({ $hasError, theme }) => ({
    backgroundColor: theme.palette.background.default,
    width: '100%',
    borderRadius: '10px',
    border: `1px solid ${$hasError ? theme.palette.error.main : theme.colorsAlpha.darkAlpha[10]}`,
    padding: '10px',
    fontSize: theme.typography.h6.fontSize,
    lineHeight: theme.typography.h6.lineHeight,
}));

export const IconContainer = styled.div(({ theme }) => ({
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
    const [showConfirm, setShowConfirm] = useState(false);
    const [newSeedWords, setNewSeedWords] = useState<string[]>();
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
        formState: { errors, isDirty },
    } = useForm({
        defaultValues: { seedWords: seedWords.join(' ').trim() },
    });

    const seedWordsValue = watch('seedWords');

    useEffect(() => {
        trigger('seedWords');
    }, [seedWordsValue, trigger]);

    const hasChanges = useMemo(() => {
        const newStr = seedWordsValue.trim();
        const oldStr = seedWords.join(' ').trim();

        return newStr !== oldStr;
    }, [seedWords, seedWordsValue]);

    const handleApply = useCallback(
        (data: { seedWords: string }) => {
            if (hasChanges) {
                setShowConfirm(true);
                setNewSeedWords(data.seedWords.split(' '));
            }
        },
        [hasChanges]
    );

    const handleConfirmed = useCallback(async () => {
        if (hasChanges && newSeedWords) {
            setShowConfirm(false);
            await importSeedWords(newSeedWords);
        }
    }, [hasChanges, importSeedWords, newSeedWords]);

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
                                variant="secondary"
                                $hasError={!!errors.seedWords}
                                disabled={seedWordsFetching}
                                onPaste={handlePaste}
                                minHeight="80px"
                                {...rest}
                            />
                        );
                    }}
                />
                <IconContainer>
                    {!errors.seedWords && (
                        <IconButton size="small" type="submit" disabled={!isDirty && !hasChanges}>
                            <IoCheckmarkOutline />
                        </IconButton>
                    )}
                    <IconButton size="small" type="reset">
                        <IoCloseOutline />
                    </IconButton>
                </IconContainer>
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
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent>
                    <Stack direction="column" alignItems="center" justifyContent="space-between" gap={16}>
                        <Typography variant="h3">{t('confirm-import-wallet')}</Typography>
                        <Typography variant="p" style={{ whiteSpace: 'pre', textAlign: 'center' }}>
                            {t('confirm-import-wallet-copy')}
                        </Typography>
                        <Stack direction="row" gap={8}>
                            <SquaredButton onClick={() => setShowConfirm(false)}>{t('cancel')}</SquaredButton>
                            <SquaredButton color="orange" onClick={handleConfirmed}>
                                {t('yes')}
                            </SquaredButton>
                        </Stack>
                    </Stack>
                </DialogContent>
            </Dialog>
        </>
    );
};
