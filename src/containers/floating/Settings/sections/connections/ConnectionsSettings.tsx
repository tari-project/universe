import Node from './Node.tsx';
import Network from './Network.tsx';
import Peers from './Peers.tsx';
import NodeTypeConfiguration from './NodeTypeConfiguration.tsx';
import { useSetupStore } from '@app/store/useSetupStore.ts';

export const ConnectionsSettings = () => {
    const isAppSettingUp = useSetupStore((s) => !s.appUnlocked);
    return (
        <>
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
