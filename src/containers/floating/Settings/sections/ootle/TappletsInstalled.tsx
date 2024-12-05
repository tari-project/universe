import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';

import { SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';
import { useInstalledTappletsStore } from '@app/store/useInstalledTappletsStore.ts';
import { MdUpdate, MdDelete } from 'react-icons/md';
import { useCallback } from 'react';
import { TappletsGroup, TappletsGroupWrapper } from './OotleSettings.styles.ts';
import tariLogo from '@app/assets/tari.svg';

const Count = styled.div<{ $count: number }>`
    border-radius: 11px;
    background-color: ${({ theme }) => theme.palette.background.accent};
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px 6px;
    line-height: 1;
    width: ${({ $count }) => ($count > 999 ? 'auto' : '22px')};
    height: ${({ $count }) => ($count > 999 ? 'auto' : '22px')};
    font-size: ${({ $count }) => ($count > 999 ? '10px' : '11px')};
`;

export default function TappletsInstalled() {
    const { t } = useTranslation('ootle');
    const fetchTapplets = useInstalledTappletsStore((s) => s?.fetchInstalledTapplets);
    const installedTapplets = useInstalledTappletsStore((state) => state.installedTapplets);
    const installedTappletsCount = installedTapplets?.length || 0;
    console.log('fethch installed tapp', installedTapplets);
    const listMarkup = installedTappletsCount
        ? installedTapplets.map((tapp, i) => <li key={`tapp-${tapp}:${i}`}>{tapp.display_name}</li>)
        : null;

    // TODO can be used if fetching from db works
    // useEffect(() => {
    //     const fetchTappletsInterval = setInterval(async () => {
    //         try {
    //             await fetchTapplets();
    //         } catch (error) {
    //             console.error('Error fetching installed tapplets:', error);
    //         }
    //     }, 5000);

    //     return () => {
    //         clearInterval(fetchTappletsInterval);
    //     };
    // }, [fetchTapplets]);

    const updateInstalledTappletHandler = useCallback(() => {
        console.log('dupa');
    }, []);
    const deleteInstalledTappletHandler = useCallback(() => {
        console.log('dupa');
    }, []);
    const deleteDevTappletHandler = useCallback(() => {
        console.log('dupa');
    }, []);

    return (
        <>
            <TappletsGroupWrapper $category="Tapplets Installed">
                <SquaredButton
                    onClick={() => fetchTapplets()}
                    color="tariPurple"
                    size="medium"
                    style={{ width: '25%', alignContent: 'center' }}
                >
                    {t('refresh-list')}
                </SquaredButton>
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
                                    <ListItemText primary={`${item.display_name} v${item.installed_version}`} />
                                    <IconButton aria-label="launch" style={{ marginRight: 10 }}>
                                        {/* <NavLink
                                            to={`/${TabKey.ACTIVE_TAPPLET}/${item.installed_tapplet.id}`}
                                            style={{ display: 'contents' }}
                                        >
                                            <MdLaunch color="primary" />
                                        </NavLink> */}
                                    </IconButton>
                                    {item.installed_version !== item.latest_version && (
                                        <IconButton
                                            aria-label="update"
                                            style={{ marginRight: 10 }}
                                            onClick={() => updateInstalledTappletHandler()}
                                        >
                                            <MdUpdate color="primary" />
                                        </IconButton>
                                    )}
                                    <IconButton
                                        aria-label="delete"
                                        style={{ marginRight: 10 }}
                                        onClick={() => deleteInstalledTappletHandler()}
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
