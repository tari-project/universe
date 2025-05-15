import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';
import { EditWrapper, Form, StyledTextArea, WarningText } from './edit.styles.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';

interface EditProps {
    onSubmit?: () => void;
}

const SEEDWORD_REGEX = /^(([a-zA-Z]+)\s){23}([a-zA-Z]+)$/;
const dialogStyles = {
    width: '380px',
    padding: '16px 30px',
    gap: 16,
};

export const Edit = ({ onSubmit }: EditProps) => {
    const [showConfirm, setShowConfirm] = useState(false);

    const { t } = useTranslation('settings', { useSuspense: false });
    const {
        register,
        setValue,
        formState: { errors },
    } = useFormContext();

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
                <Form>
                    <StyledTextArea
                        {...register('seedWords', registerOptions)}
                        $hasError={!!errors.seedWords}
                        onPaste={handlePaste}
                    />
                </Form>
            </EditWrapper>
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent $unPadded>
                    <Stack direction="column" alignItems="center" justifyContent="space-between" style={dialogStyles}>
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
