import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { Language, LanguageList } from '../../../../i18initializer.ts';
import { Button } from '@app/components/elements/Button.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useCallback } from 'react';
import { changeLanguage } from 'i18next';
import LanguageDropdown from '@app/containers/SideBar/components/Settings/components/LanguageDropdown.tsx';

export default function LanguageSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    const handleLanguageChange = useCallback((e, language: Language) => {
        e.preventDefault();
        e.stopPropagation();
        changeLanguage(language);
    }, []);

    return (
        <Stack direction="row" justifyContent="space-between">
            <Typography variant="h6">{t('change-language', { ns: 'settings' })}</Typography>
            <LanguageDropdown />
            {/*<Stack direction="row">*/}
            {/*    {LanguageList.map(({ key }) => (*/}
            {/*        <Button variant="text" key={key} onClick={(e) => handleLanguageChange(e, key)}>*/}
            {/*            {key}*/}
            {/*        </Button>*/}
            {/*    ))}*/}
            {/*</Stack>*/}
        </Stack>
    );
}
