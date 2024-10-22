import { useCallback, useState } from 'react';
import QRCode from 'react-qr-code';
import { invoke } from '@tauri-apps/api/tauri';
import styled from 'styled-components';
import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { ButtonBase } from '@app/components/elements/buttons/ButtonBase.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { Dialog, DialogContent } from '@app/components/elements/dialog/Dialog.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { IconButton } from '@app/components/elements/Button.tsx';
import { IoClose } from 'react-icons/io5';
import { Divider } from '@app/components/elements/Divider.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useTranslation } from 'react-i18next';

const StyledWrapper = styled.div`
    display: flex;
    width: 220px;
    height: 220px;
`;

export default function PaperWallet() {
    const { t } = useTranslation('settings', { useSuspense: false });
    const paperWalletEnabled = useAppConfigStore((s) => s.paper_wallet_enabled);
    const showExperimental = useUIStore((s) => s.showExperimental);
    const [qrCodeValue, setValue] = useState('');
    const [password, setPassword] = useState('');
    const [showCode, setShowCode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const load = useCallback(async () => {
        setIsLoading(true);
        const r = await invoke('get_paper_wallet_details');

        if (r) {
            const url = r.qr_link;
            const password = r.password;

            setValue(url);
            setPassword(password);
            setShowCode(true);
        }
        setIsLoading(false);
    }, []);

    if (!paperWalletEnabled || !showExperimental) return null;

    return (
        <SettingsGroupWrapper>
            <SettingsGroupContent>
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('paper-wallet.link-tari-aurora')}</Typography>
                </SettingsGroupTitle>
                <SettingsGroup>
                    <Typography>{t('connect-wallet-to-phone')}</Typography>

                    <Stack style={{ height: 40 }}>
                        {isLoading ? (
                            <CircularProgress />
                        ) : (
                            <ButtonBase onClick={load} size="small" disabled={isLoading}>
                                {t('load-qr-code')}
                            </ButtonBase>
                        )}
                    </Stack>
                </SettingsGroup>
                <Dialog open={showCode} onOpenChange={setShowCode}>
                    <DialogContent>
                        <Stack style={{ width: 400 }}>
                            <Stack justifyContent="space-between" direction="row" alignItems="center">
                                <Typography variant="h6">{t('do-not-share-this-code')}</Typography>
                                <IconButton onClick={() => setShowCode(false)}>
                                    <IoClose size={18} />
                                </IconButton>
                            </Stack>
                            <Divider />
                            <Stack alignItems="center" gap={10} style={{ padding: '10px 0' }}>
                                {qrCodeValue?.length ? (
                                    <StyledWrapper>
                                        <QRCode
                                            size={180}
                                            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                                            value={qrCodeValue}
                                        />
                                    </StyledWrapper>
                                ) : null}
                                <Divider />
                                <Typography variant="p">{t('passphrase')}:</Typography>
                                <Typography
                                    variant="h4"
                                    fontFamily={`"AvenirMedium", sans-serif`}
                                    style={{ letterSpacing: '-0.2px' }}
                                >
                                    {password}
                                </Typography>
                            </Stack>
                        </Stack>
                    </DialogContent>
                </Dialog>
            </SettingsGroupContent>
        </SettingsGroupWrapper>
    );
}
