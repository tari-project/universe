import { Select, SelectOption } from '@app/components/elements/inputs/Select.tsx';
import { Language, LanguageList, resolveI18nLanguage } from '@app/i18initializer.ts';
import styled from 'styled-components';
import { useCallback } from 'react';
import i18n, { changeLanguage } from 'i18next';
import { m } from 'framer-motion';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

type LanguageOption = SelectOption;

const languageOptions: LanguageOption[] = Object.entries(LanguageList).map(([key, name]) => ({
    label: name,
    value: key,
}));

const Wrapper = styled(m.div)`
    width: 100%;
    display: flex;
    position: relative;
`;

export default function LanguageDropdown() {
    const { setApplicationLanguage } = useAppConfigStore((s) => ({
        setApplicationLanguage: s.setApplicationLanguage,
    }));

    const handleLanguageChange = useCallback(
        (value: LanguageOption['value']) => {
            changeLanguage(value);
            setApplicationLanguage(value as Language);
        },
        [setApplicationLanguage]
    );

    return (
        <Wrapper>
            <Select
                options={languageOptions}
                onChange={handleLanguageChange}
                selectedValue={resolveI18nLanguage(i18n.language)}
                variant="bordered"
            />
        </Wrapper>
    );
}
