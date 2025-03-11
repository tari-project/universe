import { Select, SelectOption } from '@app/components/elements/inputs/Select.tsx';
import { Language, LanguageList, resolveI18nLanguage } from '@app/i18initializer.ts';
import styled from 'styled-components';
import i18n from 'i18next';
import * as m from 'motion/react-m';
import { setApplicationLanguage } from '@app/store';
import { memo } from 'react';

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

const LanguageDropdown = memo(function LanguageDropdown() {
    return (
        <Wrapper>
            <Select
                options={languageOptions}
                onChange={(value) => setApplicationLanguage(value as Language)}
                selectedValue={resolveI18nLanguage(i18n.language)}
                variant="bordered"
                forceHeight={36}
            />
        </Wrapper>
    );
});

export default LanguageDropdown;
