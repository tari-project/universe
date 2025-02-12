/* eslint-disable i18next/no-literal-string */
import { useUIStore } from '@app/store/useUIStore';
import { useShellOfSecretsStore } from '../../../store/useShellOfSecretsStore';
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { setAdminShow } from '@app/store';

export function OtherUIGroup() {
    const adminShow = useUIStore((s) => s.adminShow);
    const { showWidget, setShowWidget } = useShellOfSecretsStore();
    const setFlare = useAirdropStore((s) => s.setFlareAnimationType);
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
                <Button onClick={() => setFlare('FriendAccepted')}>FriendAccepted</Button>
                <Button onClick={() => setFlare('GoalComplete')}>GoalComplete</Button>
                <Button onClick={() => setFlare('BonusGems')}>BonusGems</Button>
            </ButtonGroup>
        </>
    );
}
