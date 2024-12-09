import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';

import { SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';
import { Avatar, IconButton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { MdDownload } from 'react-icons/md';
import { TappletsGroup, TappletsGroupWrapper } from './OotleSettings.styles.ts';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';

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

export default function TappletsRegistered() {
    const { t } = useTranslation('ootle');
    const fetchTapplets = useTappletsStore((s) => s.fetchRegisteredTapps);
    const registeredTapplets = useTappletsStore((s) => s.registeredTapplets);
    const installRegisteredTapp = useTappletsStore((s) => s.installRegisteredTapp);
    const registeredTappletsCount = registeredTapplets?.length || 0;
    console.log('fethch registered tapp', registeredTapplets);
    const listMarkup = registeredTappletsCount
        ? registeredTapplets.map((tapp, i) => <li key={`tapp-${tapp}:${i}`}>{tapp.display_name}</li>)
        : null;

    const handleInstall = async (tappletId: string) => {
        console.log('instal tapp with id', tappletId);
        await installRegisteredTapp(tappletId);
    };
    // TODO can be used if fetching from db works
    // useEffect(() => {
    //     const fetchTappletsInterval = setInterval(async () => {
    //         try {
    //             await fetchTapplets();
    //         } catch (error) {
    //             console.error('Error fetching registered tapplets:', error);
    //         }
    //     }, 5000);

    //     return () => {
    //         clearInterval(fetchTappletsInterval);
    //     };
    // }, [fetchTapplets]);

    return (
        <TappletsGroupWrapper $category="Tapplets Registered">
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
                                <ListItemText primary={item.display_name} />
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
