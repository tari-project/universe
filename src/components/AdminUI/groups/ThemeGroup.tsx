/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { useUIStore } from '@app/store/useUIStore';
import { setUITheme } from '@app/store';

export function ThemeGroup() {
    const theme = useUIStore((s) => s.theme);

    return (
        <>
            <CategoryLabel>Theme</CategoryLabel>
            <ButtonGroup>
                <Button onClick={() => setUITheme('light')} $isActive={theme === 'light'}>
                    Light
                </Button>
                <Button onClick={() => setUITheme('dark')} $isActive={theme === 'dark'}>
                    Dark
                </Button>
            </ButtonGroup>
        </>
    );
}
