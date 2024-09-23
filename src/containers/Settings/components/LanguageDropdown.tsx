import { Select, SelectOption } from '@app/components/elements/inputs/Select.tsx';
import { LanguageList } from '@app/i18initializer.ts';
import styled from 'styled-components';
import { useCallback } from 'react';
import i18n, { changeLanguage } from 'i18next';
import { m } from 'framer-motion';

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
    const handleLanguageChange = useCallback((value: LanguageOption['value']) => {
        changeLanguage(value);
    }, []);

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
