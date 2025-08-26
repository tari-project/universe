import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';

import { SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { useCallback, useEffect } from 'react';
import { TappletsGroup, TappletsGroupWrapper } from './TappletsSettings.styles.ts';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { Count } from './TappletsSettings.styles.ts';
import { setIsSettingsOpen } from '@app/store/index.ts';
import { ListItemWrapper } from '@app/components/transactions/history/List.styles.ts';
import { ListWrapper } from './styles/List.styles.ts';
import { TappletListItem } from './styles/TappletListItem.tsx';
import { setShowTapplet, setSidebarOpen } from '@app/store/actions/uiStoreActions.ts';

export default function TappletsInstalled() {
    const { t } = useTranslation('ootle', { useSuspense: false });
    const setActiveTappById = useTappletsStore((s) => s.setActiveTappById);
    const deleteInstalledTapp = useTappletsStore((s) => s.deleteInstalledTapp);
    const updateInstalledTapp = useTappletsStore((s) => s.updateInstalledTapp);
    const getInstalledTapps = useTappletsStore((s) => s.getInstalledTapps);
    const installedTapplets = useTappletsStore((s) => s.installedTapplets);
    const installedTappletsCount = installedTapplets?.length || 0;

    // add check if newer version is available
    const _updateInstalledTappletHandler = useCallback(
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

    const handleDelete = useCallback(
        async (id: number) => {
            try {
                deleteInstalledTapp(id);
            } catch (e) {
                console.error('Error closing application| handleClose in CriticalProblemDialog: ', e);
            }
        },
        [deleteInstalledTapp]
    );

    const handleStart = useCallback(
        async (id: number) => {
            try {
                setActiveTappById(id);
                setShowTapplet(true);
                setSidebarOpen(false);
                setIsSettingsOpen(false);
            } catch (e) {
                console.error('Error closing application| handleClose in CriticalProblemDialog: ', e);
            }
        },
        [setActiveTappById]
    );

    useEffect(() => {
        getInstalledTapps();
    }, []);

    return (
        <>
            <TappletsGroupWrapper $category="Tapplets Installed">
                <TappletsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('Installed Tapplets')}</Typography>

                            <Count $count={installedTappletsCount}>
                                <Typography>{installedTappletsCount}</Typography>
                            </Count>
                        </SettingsGroupTitle>
                        <ListWrapper>
                            {installedTappletsCount ? (
                                <ListItemWrapper>
                                    {installedTapplets.map((item, index) => (
                                        <TappletListItem
                                            key={index}
                                            item={{ id: item.installed_tapplet.id, displayName: item.display_name }}
                                            handleStart={() => handleStart(item.installed_tapplet.id)}
                                            handleDelete={() => handleDelete(item.installed_tapplet.id)}
                                        />
                                    ))}
                                </ListItemWrapper>
                            ) : (
                                'LIST IS EMPTY'
                            )}
                        </ListWrapper>
                    </SettingsGroupContent>
                </TappletsGroup>
            </TappletsGroupWrapper>
        </>
    );
}
