import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';

import { SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';
import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { MdDownload } from 'react-icons/md';
import { TappletsGroup, TappletsGroupWrapper } from './OotleSettings.styles.ts';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { useCallback, useEffect } from 'react';
import { Count } from './styles.ts';

export default function TappletsRegistered() {
    const { t } = useTranslation('ootle', { useSuspense: false });
    const fetchRegisteredTapplets = useTappletsStore((s) => s.fetchRegisteredTapps);
    const registeredTapplets = useTappletsStore((s) => s.registeredTapplets);
    const installRegisteredTapp = useTappletsStore((s) => s.installRegisteredTapp);
    const registeredTappletsCount = registeredTapplets?.length || 0;

    const handleInstall = useCallback(
        async (id: string) => {
            try {
                await installRegisteredTapp(id);
            } catch (e) {
                console.error('Error closing application| handleClose in CriticalProblemDialog: ', e);
            }
        },
        [installRegisteredTapp]
    );

    useEffect(() => {
        fetchRegisteredTapplets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <TappletsGroupWrapper $category="Tapplets Registered">
            <SquaredButton
                onClick={() => fetchRegisteredTapplets()}
                color="tariPurple"
                size="medium"
                style={{ width: '25%', alignContent: 'center', marginBottom: 10 }}
            >
                {t('refresh-list')}
            </SquaredButton>
            <TappletsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('registered-tapplets')}</Typography>
                        {registeredTappletsCount ? (
                            <Count $count={registeredTappletsCount}>
                                <Typography>{registeredTappletsCount}</Typography>
                            </Count>
                        ) : null}
                    </SettingsGroupTitle>

                    <List sx={{ width: '100%', minWidth: 500 }}>
                        {registeredTapplets.map((item) => (
                            <ListItem key={item.package_name} sx={{ paddingTop: 2 }}>
                                <ListItemAvatar>
                                    <Avatar src={item.logoAddr} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={item.display_name}
                                    secondary={`id: ${item.id} | registry id: ${item.registry_id}`}
                                />
                                <IconButton
                                    aria-label="install"
                                    onClick={() => handleInstall(item.id)}
                                    sx={{ marginLeft: 8 }}
                                >
                                    <MdDownload />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                </SettingsGroupContent>
            </TappletsGroup>
        </TappletsGroupWrapper>
    );
}
