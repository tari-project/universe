import styled from 'styled-components';
import RadioButton, { RadioVariant } from '@app/components/elements/inputs/RadioButton.tsx';

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
                    />
                );
            })}
        </Wrapper>
    );
}
