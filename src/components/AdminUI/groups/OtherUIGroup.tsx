/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { useAppStateStore } from '@app/store/appStateStore';

export function OtherUIGroup() {
    const { isSettingUp, setIsSettingUp } = useAppStateStore();

    return (
        <>
            <CategoryLabel>Other UI</CategoryLabel>
            <ButtonGroup>
                <Button onClick={() => setIsSettingUp(!isSettingUp)} $isActive={isSettingUp}>
                    Startup Screen
                </Button>
            </ButtonGroup>
        </>
    );
}
