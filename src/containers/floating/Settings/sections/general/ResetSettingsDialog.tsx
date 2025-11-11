import { Trans, useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

import { useState, useTransition } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Button } from '@app/components/elements/buttons/Button';
import RadioButton from '@app/components/elements/inputs/RadioButton.tsx';
import styled from 'styled-components';
import { setError } from '@app/store';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

const OptionContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 0 0 0;
`;
const ExplainerContainer = styled.div`
    display: flex;
    min-height: 38px;
    font-size: 0.8rem;
    flex-direction: column;
    align-items: center;
    padding: 4px 10px;
    text-align: justify;
    span {
        line-height: 1.1;
        strong {
            font-weight: 600;
        }
    }
`;

interface ResetSettingsDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}
export default function ResetSettingsDialog({ isOpen, onOpenChange }: ResetSettingsDialogProps) {
    const { t } = useTranslation('settings', { useSuspense: false });
    const [selectedItem, setSelectedItem] = useState<string | undefined>();
    const [isPending, startTransition] = useTransition();

    function handleClose() {
        onOpenChange(false);
        setSelectedItem(undefined);
    }
    async function resetSettingsActions() {
        try {
            await invoke('reset_settings', { resetWallet: selectedItem === 'config_and_wallet' });
        } catch (e) {
            console.error('Error when resetting settings: ', e);
            setError('Resetting settings failed: ' + e);
        }
    }

    function handleReset() {
        startTransition(async () => {
            await resetSettingsActions();
            handleClose();
        });
    }

    const options = [
        { id: 'config_only', label: t('reset-config-title') },
        { id: 'config_and_wallet', label: t('reset-config-title-wallet') },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} disableClose={isPending}>
            <DialogContent>
                <Stack alignItems="center" justifyContent="space-between" gap={8} style={{ width: 570, padding: 8 }}>
                    <Typography variant="h3">{t('reset-settings')}</Typography>
                    <Typography variant="p">{t('reset-restart')}</Typography>
                    <OptionContainer>
                        {options.map(({ id, label }) => {
                            return (
                                <RadioButton
                                    key={id}
                                    id={id}
                                    label={label}
                                    variant="neutral"
                                    styleType="minimal"
                                    checked={selectedItem === id}
                                    onChange={(e) => setSelectedItem(e.target.id)}
                                />
                            );
                        })}
                    </OptionContainer>
                    <ExplainerContainer>
                        <Typography variant="span">
                            {!selectedItem ? (
                                ''
                            ) : (
                                <Trans
                                    ns="settings"
                                    i18nKey="reset-config-explainer"
                                    components={{ strong: <strong /> }}
                                    context={selectedItem === 'config_and_wallet' ? 'wallet' : ''}
                                />
                            )}
                        </Typography>
                    </ExplainerContainer>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        style={{ width: '70%', gap: 8 }}
                    >
                        <Button size="medium" disabled={isPending} onClick={handleClose} fluid>
                            {t('cancel')}
                        </Button>
                        <Button
                            size="medium"
                            fluid
                            disabled={!selectedItem || isPending}
                            onClick={handleReset}
                            color="warning"
                            loader={<LoadingDots />}
                            isLoading={isPending}
                        >
                            {t('reset')}
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
