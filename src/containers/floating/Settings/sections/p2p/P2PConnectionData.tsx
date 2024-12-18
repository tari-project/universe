import { useP2poolStatsStore } from '@app/store/useP2poolStatsStore.ts';
import { useTranslation } from 'react-i18next';
import { truncateMiddle } from '@app/utils/truncateString.ts';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import {
    CardContainer,
    CardItem,
    CardItemLabel,
    CardItemLabelValue,
    CardItemLabelWrapper,
    CardItemTitle,
} from '@app/containers/floating/Settings/components/Settings.styles.tsx';
import { StatWrapper } from '@app/containers/floating/Settings/sections/p2p/P2PoolStats.styles.ts';
import { useEffect, useState } from 'react';
import { CardComponent } from '@app/containers/floating/Settings/components/Card.component.tsx';

interface ConnectionCounters {
    established_incoming?: number;
    established_outgoing?: number;
    pending_incoming?: number;
    pending_outgoing?: number;
}

interface NetworkInfo {
    connection_counters?: ConnectionCounters;
}

interface ConnectionInfo {
    listener_addresses?: string[];
    network_info?: NetworkInfo;
}

export default function P2PConnectionData() {
    const { t } = useTranslation('p2p');
    const [copiedId, setCopiedId] = useState<string>();
    const { copyToClipboard } = useCopyToClipboard();

    const connectionInfo = useP2poolStatsStore((s) => s?.connection_info) as ConnectionInfo;

    const listenerAddresses = connectionInfo?.listener_addresses || [];
    const { 
        established_incoming = '-', 
        established_outgoing = '-', 
        pending_incoming = '-', 
        pending_outgoing = '-' 
    } = connectionInfo?.network_info?.connection_counters || {};

    const pendingLabels = [
        { labelText: 'incoming', labelValue: pending_incoming },
        { labelText: 'outgoing', labelValue: pending_outgoing },
    ];

    const establishedLabels = [
        { labelText: 'incoming', labelValue: established_incoming },
        { labelText: 'outgoing', labelValue: established_outgoing },
    ];

    useEffect(() => {
        if (copiedId) {
            const copiedTimeout = setTimeout(() => setCopiedId(undefined), 1500);
            return () => clearTimeout(copiedTimeout);
        }
    }, [copiedId]);

    const listenerMarkup = listenerAddresses.map((addr, i) => {
        const count = i + 1;
        const displayAddr = truncateMiddle(addr, 30);
        return (
            <StatWrapper key={addr}>
                <CardItemLabelWrapper>
                    <CardItemLabel>{`${count}. `}</CardItemLabel>
                    <CardItemLabelValue title={addr}>{displayAddr}</CardItemLabelValue>
                </CardItemLabelWrapper>
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

    return (
        <>
            <CardItem>
                <CardItemTitle>
                    {t('listener-addresses')}
                    {!listenerAddresses.length && ` -`}
                </CardItemTitle>
                {listenerMarkup}
            </CardItem>

            <CardContainer>
                <CardComponent labels={establishedLabels} heading={'Established connections'} />
                <CardComponent labels={pendingLabels} heading={'Pending connections'} />
            </CardContainer>
        </>
    );
}
