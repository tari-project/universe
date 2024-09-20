import { Select, SelectOption } from '@app/components/elements/inputs/Select.tsx';
import { Language, LanguageList } from '@app/i18initializer.ts';
import styled from 'styled-components';
import { useCallback } from 'react';
import i18n, { changeLanguage } from 'i18next';
import { m } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';

type LanguageOption = SelectOption;

const languageOptions: LanguageOption[] = LanguageList.map(({ key, name }) => ({
    label: name,
    value: key,
}));

const Wrapper = styled(m.div)`
    width: 100%;
    display: flex;
    position: relative;
`;

export default function LanguageDropdown() {
    const saveLanguageToAppConfig = useCallback(
        async (applicationLanguage: Language) => {
            await invoke('set_application_language', { applicationLanguage });
        },
        [invoke]
    );

    const handleLanguageChange = useCallback(
        async (value: LanguageOption['value']) => {
            changeLanguage(value);
            await saveLanguageToAppConfig(value as Language);
        },
        [saveLanguageToAppConfig, changeLanguage]
    );

    return (
        <Wrapper>
            <Select
                options={languageOptions}
                onChange={handleLanguageChange}
                selectedValue={i18n.language}
                variant="bordered"
            />
        </Wrapper>
    );
}
