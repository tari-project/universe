/* eslint-disable i18next/no-literal-string */
import { useUIStore } from '@app/store/useUIStore';
import { useShellOfSecretsStore } from '../../../store/useShellOfSecretsStore';
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { setIsReconnecting } from '@app/store/actions/uiStoreActions';
import { setAdminShow, setFlareAnimationType } from '@app/store';

export function OtherUIGroup() {
    const adminShow = useUIStore((s) => s.adminShow);
    const showWidget = useShellOfSecretsStore((s) => s.showWidget);
    const setShowWidget = useShellOfSecretsStore((s) => s.setShowWidget);
    const isReconnecting = useUIStore((s) => s.isReconnecting);

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
                <Button onClick={() => setIsReconnecting(!isReconnecting)}>Reconnect</Button>
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
