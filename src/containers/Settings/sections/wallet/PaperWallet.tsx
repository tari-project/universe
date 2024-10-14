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

const StyledWrapper = styled.div`
    display: flex;
    width: 180px;
    height: 180px;
`;

export default function PaperWallet() {
    const paperWalletEnabled = useAppConfigStore((s) => s.paper_wallet_enabled);
    const [qrCodeValue, setValue] = useState('');
    const [showCode, setShowCode] = useState(false);
    const load = useCallback(async () => {
        const url = await invoke('get_paper_wallet_code');
        if (url) {
            setValue(url);
            setShowCode(true);
        }
    }, []);

    if (!paperWalletEnabled) return null;

    return (
        <SettingsGroupWrapper>
            <SettingsGroupContent>
                <SettingsGroupTitle>
                    <Typography variant="h6">Link Tari Aurora</Typography>
                </SettingsGroupTitle>
                <SettingsGroup>
                    <Typography>Connect your Tari Universe wallet to your phone</Typography>
                    {showCode && qrCodeValue ? (
                        <ButtonBase onClick={() => setShowCode(false)} size="small">
                            Hide QR code
                        </ButtonBase>
                    ) : (
                        <ButtonBase onClick={load} size="small">
                            Load QR code
                        </ButtonBase>
                    )}
                </SettingsGroup>
                <SettingsGroup>
                    {qrCodeValue?.length && showCode ? (
                        <StyledWrapper>
                            <QRCode
                                size={180}
                                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                                value={qrCodeValue}
                            />
                        </StyledWrapper>
                    ) : null}
                </SettingsGroup>
            </SettingsGroupContent>
        </SettingsGroupWrapper>
    );
}
