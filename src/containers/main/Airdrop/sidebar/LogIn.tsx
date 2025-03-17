import { SidebarItem } from './components/SidebarItem';
import { ActionImgWrapper, GemImg } from './items.style';
import { useTranslation } from 'react-i18next';
import gem from '@app/assets/images/gem.png';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useCallback, useState } from 'react';
import { setAllowTelemetry, setAuthUuid, useAirdropStore, useAppConfigStore } from '@app/store';
import useFetchAirdropToken from '@app/hooks/airdrop/stateHelpers/useFetchAirdropToken.ts';
import { v4 as uuidv4 } from 'uuid';
import { open } from '@tauri-apps/plugin-shell';

export default function LogIn() {
    const { t } = useTranslation('airdrop');
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const airdropUrl = useAirdropStore((s) => s.backendInMemoryConfig?.airdropUrl);

    const [linkOpened, setLinkOpened] = useState(false);

    useFetchAirdropToken({ canListen: linkOpened });

    const prepareAirdropLink = useCallback(async () => {
        const token = uuidv4();
        if (!allowTelemetry) {
            await setAllowTelemetry(true);
        }
        if (airdropUrl) {
            setAuthUuid(token);
            return `${airdropUrl}/auth?tauri=${token}`;
        }
        return null;
    }, [airdropUrl, allowTelemetry]);

    const handleAuth = useCallback(async () => {
        const url = await prepareAirdropLink();
        if (url) {
            open(url).then(() => {
                setLinkOpened(true);
            });
        }
    }, [prepareAirdropLink]);

    const tooltipContent = (
        <>
            <Typography variant="h6">{t('loggedOutTitle')}</Typography>
            <Typography variant="p">{t('topTooltipText')}</Typography>
        </>
    );

    return (
        <button onClick={handleAuth}>
            <SidebarItem text={t('joinAirdrop')} tooltipContent={tooltipContent}>
                <ActionImgWrapper style={{ marginBottom: '-4px' }}>
                    <GemImg src={gem} alt="gem ico" />
                </ActionImgWrapper>
            </SidebarItem>
        </button>
    );
}
