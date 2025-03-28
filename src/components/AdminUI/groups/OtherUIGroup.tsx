/* eslint-disable i18next/no-literal-string */
import { useUIStore } from '@app/store/useUIStore';
import { useShellOfSecretsStore } from '../../../store/useShellOfSecretsStore';
import { Button, ButtonGroup, CategoryLabel } from '../styles';

import { handleNewBlock, setAdminShow, setFlareAnimationType, useBlockchainVisualisationStore } from '@app/store';

export function OtherUIGroup() {
    const adminShow = useUIStore((s) => s.adminShow);
    const showWidget = useShellOfSecretsStore((s) => s.showWidget);
    const setShowWidget = useShellOfSecretsStore((s) => s.setShowWidget);
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
    const addDummyBlocks = () => {
        for (let i = 0; i < 1000; i++) {
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
                <Button onClick={() => setAdminShow('setup')} $isActive={adminShow === 'setup'}>
                    Startup Screen
                </Button>
                <Button onClick={() => setShowWidget(!showWidget)} $isActive={showWidget}>
                    SoS Widget
                </Button>
                <Button onClick={addDummyBlocks}>Add New Dummy Blocks</Button>
                <Button
                    onClick={() => setAdminShow(adminShow === 'orphanChainWarning' ? null : 'orphanChainWarning')}
                    $isActive={adminShow === 'orphanChainWarning'}
                >
                    Orphan chain warning
                </Button>
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
