import { useTranslation } from 'react-i18next';
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

const ExplainerContainer = styled.div`
    display: flex;
    height: 50px;
    font-size: 0.8rem;
    padding: 4px 8px 0;
    width: 100%;
    margin: 0 0 8px 0;
    span {
        line-height: 1.25;
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

    const explainerText = {
        config_only:
            'This option will remove all configuration, settings, databases, logs, peer connections, etc. in Universe, but will keep the wallet database so you retain your existing wallet address and balance.',
        config_and_wallet:
            'This option will remove all configuration, settings, databases, logs, peer connections, etc. for everything in Universe, including your existing wallet address and balance.',
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} disableClose={loading}>
            <DialogContent>
                <Stack alignItems="center" justifyContent="space-between" gap={8} style={{ width: 500 }}>
                    <Typography variant="h2">{t('reset-settings')}</Typography>
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

                    <ExplainerContainer>
                        <Typography variant="span">{selectedItem ? explainerText[selectedItem] : null}</Typography>
                    </ExplainerContainer>

                    <Stack direction="row" justifyContent="space-between" gap={8}>
                        <Button disabled={loading} onClick={handleClose}>
                            {t('cancel')}
                        </Button>

                        {loading ? (
                            <CircularProgress />
                        ) : (
                            <Button disabled={!selectedItem || loading} onClick={resetSettings} color="warning">
                                {`Reset`}
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
