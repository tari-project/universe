import { Select, SelectOption } from '@app/components/elements/inputs/Select.tsx';
import { LanguageList } from '@app/i18initializer.ts';
import styled from 'styled-components';
import { useCallback } from 'react';
import i18n, { changeLanguage } from 'i18next';

type LanguageOption = SelectOption;

const languageOptions: LanguageOption[] = LanguageList.map(({ key, name }) => ({
    label: name,
    value: key,
}));

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    position: relative;

    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.01);

    color: #000;
    font-family: Poppins, sans-serif;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 1.1;
`;

export default function LanguageDropdown() {
    const handleLanguageChange = useCallback((value: LanguageOption['value']) => {
        changeLanguage(value);
    }, []);

    return (
        <Wrapper>
            <Select options={languageOptions} onChange={handleLanguageChange} selectedValue={i18n.language} />
        </Wrapper>
    );
}
