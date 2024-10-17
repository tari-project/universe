import styled from 'styled-components';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { useSwitchTheme } from '@app/hooks/useTheming.ts';
import { useUIStore } from '@app/store/useUIStore.ts';

export const DarkModeContainer = styled.div`
    display: flex;
`;

export function ThemeSwitch() {
    const switchTheme = useSwitchTheme();
    const theme = useUIStore((s) => s.theme);
    const isDarkMode = theme === 'dark';
    return (
        <DarkModeContainer>
            <ToggleSwitch checked={isDarkMode} onChange={() => switchTheme()} label="Dark mode" />
        </DarkModeContainer>
    );
}
