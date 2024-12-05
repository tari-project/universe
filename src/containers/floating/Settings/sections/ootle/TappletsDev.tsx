import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';
import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';

import { SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';
import { useDevTappletsStore } from '@app/store/useDevTappletsStore.ts';
import { TappletsGroup, TappletsGroupWrapper } from './OotleSettings.styles.ts';
import { MdLaunch, MdDelete } from 'react-icons/md';
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

export default function TappletsDev() {
    const { t } = useTranslation('ootle');
    const fetchTapplets = useDevTappletsStore((s) => s?.fetchDevTapplets);
    const devTapplets = useDevTappletsStore((state) => state.devTapplets);
    const devTappletsCount = devTapplets?.length || 0;
    console.log('fethch dev tapp', devTapplets);
    const listMarkup = devTappletsCount
        ? devTapplets.map((tapp, i) => <li key={`tapp-${tapp}:${i}`}>{tapp.display_name}</li>)
        : null;

    // TODO can be used if fetching from db works
    // useEffect(() => {
    //     const fetchTappletsInterval = setInterval(async () => {
    //         try {
    //             await fetchTapplets();
    //         } catch (error) {
    //             console.error('Error fetching dev tapplets:', error);
    //         }
    //     }, 5000);

    //     return () => {
    //         clearInterval(fetchTappletsInterval);
    //     };
    // }, [fetchTapplets]);

    return (
        <TappletsGroupWrapper $category="Dev Tapplets">
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
                        <Typography variant="h6">{t('dev-tapplets')}</Typography>
                        {devTappletsCount ? (
                            <Count $count={devTappletsCount}>
                                <Typography>{devTappletsCount}</Typography>
                            </Count>
                        ) : null}
                    </SettingsGroupTitle>

                    <List sx={{ maxWidth: 600 }}>
                        {devTapplets.map((item, index) => (
                            <ListItem key={index}>
                                <ListItemAvatar>
                                    <Avatar src={tariLogo.toString()} />
                                </ListItemAvatar>
                                <ListItemText primary={item.display_name} />
                                <IconButton aria-label="launch" style={{ marginRight: 10 }}>
                                    {/* <NavLink
                                        to={`/${TabKey.DEV_TAPPLETS}/${item.id}`}
                                        state={item}
                                        style={{ display: 'contents' }}
                                    >
                                    </NavLink> */}
                                    <MdLaunch color="primary" />
                                </IconButton>
                                <IconButton
                                    aria-label="delete"
                                    style={{ marginRight: 10 }}
                                    onClick={() => {
                                        console.log('dupa');
                                    }}
                                >
                                    <MdDelete color="primary" />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                </SettingsGroupContent>
            </TappletsGroup>
        </TappletsGroupWrapper>
    );
}
