import { Select, SelectOption } from '@app/components/elements/inputs/Select.tsx';
import { Language, LanguageList, resolveI18nLanguage } from '@app/i18initializer.ts';
import styled from 'styled-components';
import i18n from 'i18next';
import * as m from 'motion/react-m';
import { setApplicationLanguage } from '@app/store';
import { useReducer } from 'react';

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

function LanguageDropdown() {
    const [, forceUpdate] = useReducer((x) => x + 1, 0);
    const handleLanguageChange = (value: string) => {
        setApplicationLanguage(value as Language);
        forceUpdate(); // Since i18n is outside of store component doesn't update
    };
    return (
        <Wrapper>
            <Select
                options={languageOptions}
                onChange={handleLanguageChange}
                selectedValue={resolveI18nLanguage(i18n.language)}
                variant="bordered"
                forceHeight={36}
            />
        </Wrapper>
    );
}

export default LanguageDropdown;
