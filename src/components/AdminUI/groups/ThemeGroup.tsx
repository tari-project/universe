/* eslint-disable i18next/no-literal-string */
import { AdminButton, ButtonGroup, CategoryLabel } from '../styles';
import { useUIStore } from '@app/store/useUIStore';
import { setUITheme } from '@app/store';

export function ThemeGroup() {
    const theme = useUIStore((s) => s.theme);

    return (
        <>
            <CategoryLabel>Theme</CategoryLabel>
            <ButtonGroup>
                <AdminButton onClick={() => setUITheme('light')} $isActive={theme === 'light'}>
                    Light Theme
                </AdminButton>
                <AdminButton onClick={() => setUITheme('dark')} $isActive={theme === 'dark'}>
                    Dark Theme
                </AdminButton>
            </ButtonGroup>
        </>
    );
}
