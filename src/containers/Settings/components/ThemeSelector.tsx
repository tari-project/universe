import styled from 'styled-components';
import RadioButton, { RadioVariant } from '@app/components/elements/inputs/RadioButton.tsx';
import { useCallback } from 'react';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

const Wrapper = styled.fieldset`
    width: 100%;
    display: flex;
    position: relative;
    gap: 15px;
`;

const themeOptions = ['system', 'light', 'dark'];
export default function ThemeSelector() {
    const configTheme = useAppConfigStore((s) => s.theme);
    const setTheme = useAppConfigStore((s) => s.setTheme);

    const handleChange = useCallback(
        async (e) => {
            const themeName = e.target.id;
            if (e.target.checked) {
                await setTheme(themeName);
            }
        },
        [setTheme]
    );

    return (
        <Wrapper>
            {themeOptions.map((themeOption) => {
                const checked = configTheme?.toLowerCase() == themeOption;
                return (
                    <RadioButton
                        key={themeOption}
                        id={themeOption}
                        name="theme_select"
                        value={themeOption}
                        label={themeOption}
                        variant={(themeOption === 'system' ? 'neutral' : themeOption) as RadioVariant}
                        onChange={handleChange}
                        checked={checked}
                    />
                );
            })}
        </Wrapper>
    );
}