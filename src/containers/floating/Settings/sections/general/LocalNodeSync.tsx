import { memo, useMemo } from 'react';
import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';
import { useNodeStore } from '@app/store/useNodeStore.ts';
import { useTranslation } from 'react-i18next';

const SyncWrapper = styled.div`
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    border: 1px solid ${({ theme }) => theme.palette.divider};
    padding: 20px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const InfoWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;
const LocalNodeSync = memo(function LocalNodeSync() {
    const { t } = useTranslation(['setup-progresses', 'setup-view'], { useSuspense: false });
    const lastUpdate = useNodeStore((s) => s.backgroundNodeSyncLastUpdate);
    console.debug(`lastUpdate= `, lastUpdate);
    const setupCopy = useMemo(() => {
        if (!lastUpdate) return '';
        switch (lastUpdate.step) {
            case 'Startup':
                return t('title.waiting-for-initial-sync', {
                    initial_connected_peers: lastUpdate.initial_connected_peers,
                    required_peers: lastUpdate.required_peers,
                });
            case 'Header':
                return t('title.waiting-for-header-sync', {
                    local_header_height: lastUpdate.local_header_height,
                    tip_header_height: lastUpdate.tip_header_height,
                    local_block_height: lastUpdate.local_block_height,
                    tip_block_height: lastUpdate.tip_block_height,
                });
            case 'Block':
                return t('title.waiting-for-block-sync', {
                    local_header_height: lastUpdate.local_header_height,
                    tip_header_height: lastUpdate.tip_header_height,
                    local_block_height: lastUpdate.local_block_height,
                    tip_block_height: lastUpdate.tip_block_height,
                });
            default:
                return null;
        }
    }, [lastUpdate, t]);

    return (
        <SyncWrapper>
            <InfoWrapper>
                <Typography variant="h6">{`Tari Universe is still syncing. This won’t affect your mining experience.`}</Typography>
                <Typography variant="p">{`Syncing node`}</Typography>
                <Typography variant="p">{setupCopy}</Typography>
            </InfoWrapper>
            <CircularProgress />
        </SyncWrapper>
    );
});

export default LocalNodeSync;
