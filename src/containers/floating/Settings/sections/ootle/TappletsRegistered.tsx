import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SettingsGroup, SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { TappletsGroup, TappletsGroupWrapper } from './TappletsSettings.styles.ts';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { useCallback, useEffect, useRef } from 'react';
import { Count } from './TappletsSettings.styles.ts';
import { ListItemWrapper } from '@app/components/transactions/history/List.styles.ts';
import { ListWrapper } from './styles/List.styles.ts';
import { TappletListItem } from './styles/TappletListItem.tsx';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';
import { IoRefreshCircle } from 'react-icons/io5';

export default function TappletsRegistered() {
    const { t } = useTranslation('ootle', { useSuspense: false });
    const fetchRegisteredTapplets = useTappletsStore((s) => s.fetchRegisteredTapps);
    const registeredTapplets = useTappletsStore((s) => s.registeredTapplets);
    const installRegisteredTapp = useTappletsStore((s) => s.installRegisteredTapp);
    const isInitialized = useTappletsStore((s) => s.isInitialized);
    const hasFetchedRef = useRef(false);
    const registeredTappletsCount = registeredTapplets?.length || 0;

    const handleInstall = useCallback(
        async (id: number) => {
            try {
                await installRegisteredTapp(id);
            } catch (e) {
                console.error('Error closing application| handleClose in CriticalProblemDialog: ', e);
            }
        },
        [installRegisteredTapp]
    );

    useEffect(() => {
        if (!isInitialized && !hasFetchedRef.current) {
            fetchRegisteredTapplets();
            hasFetchedRef.current = true;
        }
    }, [fetchRegisteredTapplets, isInitialized]);

    return (
        <TappletsGroupWrapper $category="Tapplets Registered">
            <TappletsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('Registered Tapplets')}</Typography>
                        <SettingsGroup>
                            <IconButton
                                color="brightGreen"
                                size="medium"
                                type="button"
                                onClick={() => fetchRegisteredTapplets()}
                            >
                                <IoRefreshCircle />
                            </IconButton>
                            <Count $count={registeredTappletsCount}>
                                <Typography>{registeredTappletsCount}</Typography>
                            </Count>
                        </SettingsGroup>
                    </SettingsGroupTitle>
                    <ListWrapper>
                        {registeredTappletsCount ? (
                            <ListItemWrapper>
                                {registeredTapplets.map((item, index) => (
                                    <TappletListItem
                                        key={index}
                                        item={{ id: item.id, displayName: item.display_name }}
                                        handleStart={() => handleInstall(item.id)}
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
