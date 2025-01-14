import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';

import { SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { MdUpdate, MdDelete, MdLaunch } from 'react-icons/md';
import { useCallback, useEffect } from 'react';
import { TappletsGroup, TappletsGroupWrapper } from './OotleSettings.styles.ts';
import tariLogo from '@app/assets/tari.svg';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { Count } from './styles.ts';

export default function TappletsInstalled() {
    const { t } = useTranslation('ootle', { useSuspense: false });
    const { isSettingsOpen, setIsSettingsOpen } = useAppStateStore();
    const setActiveTapp = useTappletsStore((s) => s.setActiveTapp);
    const deleteInstalledTapp = useTappletsStore((s) => s.deleteInstalledTapp);
    const updateInstalledTapp = useTappletsStore((s) => s.updateInstalledTapp);
    const getInstalledTapps = useTappletsStore((s) => s.getInstalledTapps);
    const installedTapplets = useTappletsStore((s) => s.installedTapplets);
    const installedTappletsCount = installedTapplets?.length || 0;

    const updateInstalledTappletHandler = useCallback(
        async (id: number, installedTappletId: number) => {
            try {
                console.info('Update id, tapp id ', id, installedTappletId);
                updateInstalledTapp(id, installedTappletId);
            } catch (e) {
                console.error('Error closing application| handleClose in CriticalProblemDialog: ', e);
            }
        },
        [updateInstalledTapp]
    );

    const deleteInstalledTappletHandler = useCallback(
        async (id: number) => {
            try {
                deleteInstalledTapp(id);
            } catch (e) {
                console.error('Error closing application| handleClose in CriticalProblemDialog: ', e);
            }
        },
        [deleteInstalledTapp]
    );

    const handleLaunch = useCallback(
        async (id: number) => {
            try {
                const tapplet = await invoke('launch_tapplet', { installedTappletId: id });
                setActiveTapp(tapplet);
                setIsSettingsOpen(!isSettingsOpen);
            } catch (e) {
                console.error('Error closing application| handleClose in CriticalProblemDialog: ', e);
            }
        },
        [isSettingsOpen, setActiveTapp, setIsSettingsOpen]
    );

    useEffect(() => {
        getInstalledTapps();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <>
            <TappletsGroupWrapper $category="Tapplets Installed">
                <TappletsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('installed-tapplets')}</Typography>
                            {installedTappletsCount ? (
                                <Count $count={installedTappletsCount}>
                                    <Typography>{installedTappletsCount}</Typography>
                                </Count>
                            ) : null}
                        </SettingsGroupTitle>

                        <List sx={{ width: '100%', minWidth: 500 }}>
                            {installedTapplets.map((item, index) => (
                                <ListItem key={index}>
                                    <ListItemAvatar>
                                        <Avatar src={item.logoAddr} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={`${item.display_name} ver ${item.installed_version}`}
                                        secondary={`id: ${item.installed_tapplet.id} | tapplet id: ${item.installed_tapplet.tapplet_id}`}
                                    />
                                    <IconButton
                                        aria-label="launch"
                                        style={{ marginRight: 10 }}
                                        onClick={() => handleLaunch(item.installed_tapplet.id)}
                                    >
                                        <MdLaunch color="primary" />
                                    </IconButton>
                                    {item.latest_version && item.installed_version !== item.latest_version && (
                                        <IconButton
                                            aria-label="update"
                                            style={{ marginRight: 10 }}
                                            onClick={() =>
                                                updateInstalledTappletHandler(
                                                    item.installed_tapplet.id,
                                                    item.installed_tapplet.tapplet_id
                                                )
                                            }
                                        >
                                            <MdUpdate color="primary" />
                                        </IconButton>
                                    )}
                                    <IconButton
                                        aria-label="delete"
                                        style={{ marginRight: 10 }}
                                        onClick={() => deleteInstalledTappletHandler(item.installed_tapplet.id)}
                                    >
                                        <MdDelete color="primary" />
                                    </IconButton>
                                </ListItem>
                            ))}
                        </List>
                    </SettingsGroupContent>
                </TappletsGroup>
            </TappletsGroupWrapper>
        </>
    );
}
