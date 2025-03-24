import { useCallback, useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { setAuthUuid } from '@app/store/actions/airdropStoreActions';
import { ClaimButton, GemPill, Image, Title, Wrapper } from './styles';
import gemImage from '../../images/gem.png';
import useFetchAirdropToken from '@app/hooks/airdrop/stateHelpers/useFetchAirdropToken.ts';
import { setAllowTelemetry, useAppConfigStore } from '@app/store';
import { useCopyToClipboard } from '@app/hooks';

export default function LoggedOut() {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const [linkOpened, setLinkOpened] = useState(false);
    const [copying, setCopying] = useState(false);
    const [copyError, setCopyError] = useState(false);
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const airdropUrl = useAirdropStore((s) => s.backendInMemoryConfig?.airdropUrl);

    useFetchAirdropToken({ canListen: linkOpened });

    // Extracted common logic for preparing the airdrop link
    const prepareAirdropLink = useCallback(
        async (code?: string) => {
            const token = uuidv4();
            if (!allowTelemetry) {
                await setAllowTelemetry(true);
            }
            if (airdropUrl) {
                setAuthUuid(token);
                return `${airdropUrl}/auth?tauri=${token}${code ? `&universeReferral=${code}` : ''}`;
            }
            return null;
        },
        [airdropUrl, allowTelemetry]
    );

    const handleAuth = useCallback(
        async (code?: string) => {
            const url = await prepareAirdropLink(code);
            if (url) {
                open(url).then(() => {
                    setLinkOpened(true);
                });
            }
        },
        [prepareAirdropLink]
    );

    const handleRightClick = useCallback(
        async (e, code?: string) => {
            e.preventDefault();
            setCopying(true);
            setCopyError(false);

            try {
                const url = await prepareAirdropLink(code);
                if (url) {
                    copyToClipboard(url);
                } else {
                    throw new Error('Failed to generate URL');
                }
            } catch (error) {
                console.error('Failed to copy to clipboard:', error);
                setCopyError(true);

                // Auto-clear error state after 3 seconds
                setTimeout(() => {
                    setCopyError(false);
                }, 3000);
            } finally {
                setCopying(false);
            }
        },
        [prepareAirdropLink, copyToClipboard]
    );

    const gemsValue = GIFT_GEMS.toLocaleString();

    // Determine button text based on state
    const getButtonText = () => {
        if (copying) return t('copying');
        if (copyError) return t('copyFailed');
        if (isCopied) return t('copied');
        return t('joinAirdrop');
    };

    return (
        <Wrapper>
            <ClaimButton
                onClick={() => handleAuth()}
                onContextMenu={(e) => handleRightClick(e)}
                title={t('rightClickToCopy')}
                aria-label={t('joinAirdropButtonAriaLabel')}
                $hasError={copyError}
            >
                <Title>{getButtonText()}</Title>

                <GemPill>
                    {gemsValue}
                    <Image src={gemImage} alt="" />
                </GemPill>
            </ClaimButton>
        </Wrapper>
    );
}
