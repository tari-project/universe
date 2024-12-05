import { useP2poolStatsStore } from '@app/store/useP2poolStatsStore.ts';
import { SettingsGroupContent } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { truncateMiddle } from '@app/utils/truncateString.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { CardItem, CardItemTitle } from '@app/containers/floating/Settings/components/Settings.styles.tsx';
import { StatWrapper } from '@app/containers/floating/Settings/sections/p2p/P2PoolStats.styles.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useEffect, useState } from 'react';

export default function P2PConnectionData() {
    const { t } = useTranslation('p2p');
    const [copiedId, setCopiedId] = useState<string>();
    const { copyToClipboard } = useCopyToClipboard();
    const connectionInfo = useP2poolStatsStore((s) => s.connection_info);

    useEffect(() => {
        if (copiedId) {
            const copiedTimeout = setTimeout(() => {
                setCopiedId(undefined);
            }, 1500);
            return () => {
                clearTimeout(copiedTimeout);
            };
        }
    }, [copiedId]);

    const listenerMarkup = connectionInfo?.listener_addresses?.map((addr, i) => {
        const count = i + 1;
        const displayAddr = truncateMiddle(addr, 30);
        return (
            <StatWrapper key={addr}>
                <Typography title={addr} variant="p">
                    {`${count}. `}
                    <em>{displayAddr}</em>
                </Typography>

                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.preventDefault();
                        copyToClipboard(addr, () => setCopiedId(addr));
                    }}
                >
                    {copiedId === addr ? <IoCheckmarkOutline /> : <IoCopyOutline />}
                </IconButton>
            </StatWrapper>
        );
    });

    // const networkMarkup =
    //
    return (
        <SettingsGroupContent>
            <Stack gap={8}>
                <CardItem>
                    <CardItemTitle>{t('listener-addresses')}</CardItemTitle>
                    {listenerMarkup}
                </CardItem>
            </Stack>
        </SettingsGroupContent>
    );
}
