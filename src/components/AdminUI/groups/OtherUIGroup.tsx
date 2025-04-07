/* eslint-disable i18next/no-literal-string */
import { useUIStore } from '@app/store/useUIStore';
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { setConnectionStatus } from '@app/store/actions/uiStoreActions';
import { handleNewBlock, setFlareAnimationType, useBlockchainVisualisationStore } from '@app/store';

export function OtherUIGroup() {
    const connectionStatus = useUIStore((s) => s.connectionStatus);

    const shiftConnectionStatus = () => {
        if (connectionStatus === 'connected') {
            setConnectionStatus('disconnected');
        } else if (connectionStatus === 'disconnected') {
            setConnectionStatus('disconnected-severe');
        } else {
            setConnectionStatus('connected');
        }
    };
    const height = useBlockchainVisualisationStore((s) => s.displayBlockHeight);
    const dummyNewBlock = {
        block_height: height || 4000,
        coinbase_transaction: undefined,
        balance: {
            available_balance: 333748143307,
            timelocked_balance: 13904199881,
            pending_incoming_balance: 0,
            pending_outgoing_balance: 0,
        },
    };
    const addDummyBlocks = (count = 1000) => {
        for (let i = 0; i < count; i++) {
            handleNewBlock({
                ...dummyNewBlock,
                block_height: dummyNewBlock.block_height + i,
            });
        }
    };

    return (
        <>
            <CategoryLabel>Other UI</CategoryLabel>
            <ButtonGroup>
                <Button onClick={() => addDummyBlocks()}>Add New Dummy Blocks</Button>
                <Button onClick={shiftConnectionStatus}>Change connection status</Button>
            </ButtonGroup>
            <CategoryLabel>Gem animations</CategoryLabel>
            {/* TODO: add the other sections if we want */}
            <ButtonGroup>
                <Button onClick={() => setFlareAnimationType('FriendAccepted')}>FriendAccepted</Button>
                <Button onClick={() => setFlareAnimationType('GoalComplete')}>GoalComplete</Button>
                <Button onClick={() => setFlareAnimationType('BonusGems')}>BonusGems</Button>
            </ButtonGroup>
        </>
    );
}
