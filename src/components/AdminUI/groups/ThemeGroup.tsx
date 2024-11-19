/* eslint-disable i18next/no-literal-string */
import { Button, ButtonGroup, CategoryLabel } from '../styles';
import { useUIStore } from '@app/store/useUIStore';

export function ThemeGroup() {
    const { setTheme, theme } = useUIStore();

    return (
        <>
            <CategoryLabel>Theme</CategoryLabel>
            <ButtonGroup>
                <Button onClick={() => setTheme('light')} $isActive={theme === 'light'}>
                    Light Theme
                </Button>
                <Button onClick={() => setTheme('dark')} $isActive={theme === 'dark'}>
                    Dark Theme
                </Button>
            </ButtonGroup>
        </>
    );
}
