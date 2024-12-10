/* eslint-disable i18next/no-literal-string */
import { useUIStore } from '@app/store/useUIStore';
import { useShellOfSecretsStore } from '../../../store/useShellOfSecretsStore';
import { Button, ButtonGroup, CategoryLabel } from '../styles';

export function OtherUIGroup() {
    const setAdminShow = useUIStore((s) => s.setAdminShow); // prevent messing up the actual setup progress value
    const adminShow = useUIStore((s) => s.adminShow);
    const { showWidget, setShowWidget } = useShellOfSecretsStore();

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
                {/* TODO: add the other sections if we want */}
            </ButtonGroup>
        </>
    );
}
