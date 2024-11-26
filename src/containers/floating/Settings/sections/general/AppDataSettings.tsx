import { IconButton } from '@app/components/elements/buttons/IconButton';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useTranslation } from 'react-i18next';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import {
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';

export default function AppDataSettings() {
    const { t } = useTranslation('settings');
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const anon_id = useAppConfigStore((s) => s.anon_id);

    return (
        <>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('application-info')}</Typography>
            </SettingsGroupTitle>
            {anon_id && (
                <SettingsGroupContent>
                    <Stack direction="row" alignItems="center" justifyContent="flex-start">
                        {/* eslint-disable-next-line i18next/no-literal-string */}
                        <Typography variant="p">Anon ID: {anon_id}</Typography>
                        <IconButton onClick={() => copyToClipboard(anon_id)} size="small">
                            {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                        </IconButton>
                    </Stack>
                </SettingsGroupContent>
            )}
        </>
    );
}
