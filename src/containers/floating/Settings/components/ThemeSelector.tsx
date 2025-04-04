import styled from 'styled-components';
import RadioButton, { RadioVariant } from '@app/components/elements/inputs/RadioButton.tsx';

import { useCallback } from 'react';
import { setUITheme, useConfigUIStore } from '@app/store';
import { setDisplayMode } from '@app/store/actions/appConfigStoreActions';

const Wrapper = styled.fieldset`
    width: 100%;
    display: flex;
    position: relative;
    gap: 15px;
`;

const themeOptions = ['system', 'light', 'dark'];
export default function ThemeSelector() {
    const configTheme = useConfigUIStore((s) => s.display_mode);

    const handleChange = useCallback(async (e) => {
        const themeName = e.target.id;
        if (e.target.checked) {
            setDisplayMode(themeName).then(() => setUITheme(themeName));
        }
    }, []);

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
                        checked={checked}
                        onChange={handleChange}
                    />
                );
            })}
        </Wrapper>
    );
}
