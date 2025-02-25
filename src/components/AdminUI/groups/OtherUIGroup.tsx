/* eslint-disable i18next/no-literal-string */
import { useUIStore } from '@app/store/useUIStore';
import { useShellOfSecretsStore } from '../../../store/useShellOfSecretsStore';
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { playBlockWinAudio, playNotificationAudio } from '@app/store/useBlockchainVisualisationStore';

export function OtherUIGroup() {
    const setAdminShow = useUIStore((s) => s.setAdminShow); // prevent messing up the actual setup progress value
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
            <CategoryLabel>Audio assets</CategoryLabel>
            <ButtonGroup>
                <Button onClick={() => playNotificationAudio()}>Notification</Button>
                <Button onClick={() => playBlockWinAudio(1)}>Tier 1</Button>
                <Button onClick={() => playBlockWinAudio(2)}>Tier 2</Button>
                <Button onClick={() => playBlockWinAudio(3)}>Tier 3</Button>
            </ButtonGroup>
        </>
    );
}
