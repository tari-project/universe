import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import { IoClose } from 'react-icons/io5';
import { Divider } from '@app/components/elements/Divider.tsx';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { useTheme } from 'styled-components';

interface ConfirmationDialogProps {
    title?: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationDialog({
    title = 'confirm-action',
    description,
    onConfirm,
    onCancel,
}: ConfirmationDialogProps) {
    const { t } = useTranslation('settings', { useSuspense: false });
    const theme = useTheme();

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent>
                <Stack style={{ minWidth: 400, maxWidth: 640 }}>
                    <Stack justifyContent="space-between" direction="row" alignItems="center">
                        <Typography variant="h3">{t(title)}</Typography>
                        <IconButton onClick={onCancel}>
                            <IoClose size={18} />
                        </IconButton>
                    </Stack>
                    <Divider />
                    <Stack direction="column" alignItems="center" justifyContent="space-between" gap={24}>
                        <Stack gap={6}>
                            <Typography variant="p">{t(description)}</Typography>
                        </Stack>

                        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={8}>
                            <Button size="small" variant="gradient" onClick={onConfirm}>
                                {t('confirm')}
                            </Button>
                            <TextButton
                                onClick={onCancel}
                                color="grey"
                                colorIntensity={theme.mode === 'light' ? 700 : 200}
                            >
                                {t('cancel')}
                            </TextButton>
                        </Stack>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
