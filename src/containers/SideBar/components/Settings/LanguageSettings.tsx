import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { Stack } from '@app/components/elements/Stack.tsx';
import LanguageDropdown from '@app/containers/SideBar/components/Settings/components/LanguageDropdown.tsx';

export default function LanguageSettings() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });

    return (
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{t('change-language', { ns: 'settings' })}</Typography>
            <LanguageDropdown />
        </Stack>
    );
}
