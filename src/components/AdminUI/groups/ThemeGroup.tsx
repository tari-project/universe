/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { setUITheme, useUIStore } from '@app/store/useUIStore';

export function ThemeGroup() {
    const theme = useUIStore((s) => s.theme);

    return (
        <>
            <CategoryLabel>Theme</CategoryLabel>
            <ButtonGroup>
                <Button onClick={() => setUITheme('light')} $isActive={theme === 'light'}>
                    Light Theme
                </Button>
                <Button onClick={() => setUITheme('dark')} $isActive={theme === 'dark'}>
                    Dark Theme
                </Button>
            </ButtonGroup>
        </>
    );
}
