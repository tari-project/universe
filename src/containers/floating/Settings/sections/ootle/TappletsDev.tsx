import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';

import { SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { TappletsGroup, TappletsGroupWrapper, Count } from './TappletsSettings.styles.ts';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { useCallback, useEffect } from 'react';
import { useAppStateStore } from '@app/store/appStateStore.ts';
import { setError, setIsSettingsOpen } from '@app/store/index.ts';

import TappletDevPathForm from './TappletDevPathForm.tsx';
import { TappletListItem } from './styles/TappletListItem.tsx';
import { ListItemWrapper, ListWrapper } from './styles/List.styles.ts';
import { setShowTapplet, setSidebarOpen } from '@app/store/actions/uiStoreActions.ts';

export default function TappletsDev() {
    const { t } = useTranslation('ootle', { useSuspense: false });
    const setActiveTappById = useTappletsStore((s) => s.setActiveTappById);
    const deleteDevTapp = useTappletsStore((s) => s.deleteDevTapp);
    const getDevTapps = useTappletsStore((s) => s.getDevTapps);
    const stopTapp = useTappletsStore((s) => s.stopTapp);
    const restartTapp = useTappletsStore((s) => s.restartTapp);
    const devTapplets = useTappletsStore((s) => s.devTapplets);
    const { isSettingsOpen } = useAppStateStore();
    const devTappletsCount = devTapplets?.length || 0;

    const handleStop = useCallback(
        async (tappletId: number) => {
            try {
                stopTapp(tappletId);
            } catch (e) {
                setError(`Error while launching dev tapplet: ${e}`);
            }
        },
        [stopTapp]
    );

    const handleDelete = useCallback(
        async (tappletId: number) => {
            try {
                deleteDevTapp(tappletId);
            } catch (e) {
                setError(`Error while launching dev tapplet: ${e}`);
            }
        },
        [deleteDevTapp]
    );

    const handleRestart = useCallback(
        async (tappletId: number) => {
            try {
                await restartTapp(tappletId);
                setActiveTappById(tappletId, false);
                setIsSettingsOpen(!isSettingsOpen);
                setShowTapplet(true);
                setSidebarOpen(false);
                setIsSettingsOpen(false);
            } catch (e) {
                setError(`Error while launching dev tapplet: ${e}`);
            }
        },
        [isSettingsOpen, restartTapp, setActiveTappById]
    );

    const handleLaunch = useCallback(
        async (tappletId: number) => {
            try {
                setActiveTappById(tappletId, false);
                setIsSettingsOpen(!isSettingsOpen);
                setShowTapplet(true);
                setSidebarOpen(false);
                setIsSettingsOpen(false);
            } catch (e) {
                setError(`Error while launching dev tapplet: ${e}`);
            }
        },
        [isSettingsOpen, setActiveTappById]
    );

    useEffect(() => {
        getDevTapps();
    }, [getDevTapps]);

    return (
        <TappletsGroupWrapper $category="Dev Tapplets">
            <TappletDevPathForm />
            <TappletsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('Dev tapplets')}</Typography>
                        <Count $count={devTappletsCount}>
                            <Typography>{devTappletsCount}</Typography>
                        </Count>
                    </SettingsGroupTitle>
                    <ListWrapper>
                        {devTappletsCount ? (
                            <ListItemWrapper>
                                {devTapplets.map((item, index) => (
                                    <TappletListItem
                                        key={index}
                                        item={{
                                            id: item.id,
                                            displayName: item.display_name,
                                            isRunning: item.isRunning ?? false,
                                        }}
                                        handleStart={() => handleLaunch(item.id)}
                                        handleDelete={() => handleDelete(item.id)}
                                        handleStop={() => handleStop(item.id)}
                                        handleRestart={() => handleRestart(item.id)}
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
    );
}
