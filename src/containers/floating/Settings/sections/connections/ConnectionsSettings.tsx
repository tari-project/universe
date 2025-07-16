import Node from './Node.tsx';
import Network from './Network.tsx';
import Peers from './Peers.tsx';
import NodeTypeConfiguration from './NodeTypeConfiguration.tsx';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { Sync } from '@app/components/sync/Sync.tsx';
import LocalNodeSync from '@app/containers/floating/Settings/sections/general/LocalNodeSync.tsx';

export const ConnectionsSettings = () => {
    const isAppSettingUp = useSetupStore((s) => !s.appUnlocked);
    return (
        <>
            <Sync />
            <LocalNodeSync />
            {import.meta.env.MODE == 'development' && <NodeTypeConfiguration />}
            <Node />
            {!isAppSettingUp && (
                <>
                    <Network />
                    <Peers />
                </>
            )}
        </>
    );
};
