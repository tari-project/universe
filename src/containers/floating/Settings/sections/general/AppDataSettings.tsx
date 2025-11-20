import { IconButton } from '@app/components/elements/buttons/IconButton';
import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard';
import { useTranslation } from 'react-i18next';
import { IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5';
import { SettingsGroup, SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';

export default function AppDataSettings() {
    const { t } = useTranslation('settings');
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const anon_id = useConfigCoreStore((s) => s.anon_id);

    return (
        <SettingsGroup>
            <SettingsGroupContent>
                <SettingsGroupTitle>
                    <Typography variant="h6">{t('application-info')}</Typography>
                </SettingsGroupTitle>
                {anon_id && (
                    <Stack direction="row" alignItems="center" justifyContent="flex-start">
                        {/* eslint-disable-next-line i18next/no-literal-string */}
                        <Typography variant="p">
                            Anon ID: <strong>{anon_id}</strong>
                        </Typography>
                        <IconButton onClick={() => copyToClipboard(anon_id)} size="small">
                            {!isCopied ? <IoCopyOutline /> : <IoCheckmarkOutline />}
                        </IconButton>
                    </Stack>
                )}
            </SettingsGroupContent>
        </SettingsGroup>
    );
}
