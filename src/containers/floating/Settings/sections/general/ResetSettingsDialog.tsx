import { Trans, useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Button } from '@app/components/elements/buttons/Button';
import RadioButton from '@app/components/elements/inputs/RadioButton.tsx';
import styled from 'styled-components';

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
    padding: 0 12px;
    text-align: justify;
    span {
        line-height: 1.2;
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
    const setError = useAppStateStore((state) => state.setError);
    const [selectedItem, setSelectedItem] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);

    function handleClose() {
        onOpenChange(false);
        setSelectedItem(undefined);
    }
    function resetSettings() {
        setLoading(true);
        invoke('reset_settings', { resetWallet: selectedItem === 'config_and_wallet' })
            .then(() => {
                setLoading(false);
                handleClose();
            })
            .catch((e) => {
                console.error('Error when resetting settings: ', e);
                setError('Resetting settings failed: ' + e);
                setLoading(false);
                handleClose();
            });
    }

    const options = [
        { id: 'config_only', label: 'Reset all configuration settings' },
        { id: 'config_and_wallet', label: 'Reset all configuration settings, and generate a new wallet' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} disableClose={loading}>
            <DialogContent>
                <Stack alignItems="center" justifyContent="space-between" gap={10} style={{ width: 560 }}>
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
                    {loading ? (
                        <CircularProgress />
                    ) : (
                        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={8}>
                            <Button size="medium" disabled={loading} onClick={handleClose}>
                                {t('cancel')}
                            </Button>

                            <Button
                                size="medium"
                                disabled={!selectedItem || loading}
                                onClick={resetSettings}
                                color="warning"
                            >
                                {t('reset')}
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
