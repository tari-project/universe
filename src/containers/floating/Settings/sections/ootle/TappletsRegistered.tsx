import { useTranslation } from 'react-i18next';

import { Typography } from '@app/components/elements/Typography.tsx';

import { SettingsGroupContent, SettingsGroupTitle } from '../../components/SettingsGroup.styles.ts';
import { SquaredButton } from '@app/components/elements/buttons/SquaredButton.tsx';
import { TappletsGroup, TappletsGroupWrapper } from './OotleSettings.styles.ts';
import { useTappletsStore } from '@app/store/useTappletsStore.ts';
import { useCallback, useEffect } from 'react';
import { Count } from './OotleSettings.styles.ts';
import { PlaceholderItem } from '@app/components/transactions/history/ListItem.styles.ts';
import { ListItemWrapper } from '@app/components/transactions/history/List.styles.ts';
import { ListWrapper } from './styles/List.styles.ts';
import { TappletListItem } from './styles/TappletListItem.tsx';

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

    // useEffect(() => {
    //     fetchRegisteredTapplets();
    // }, []);

    return (
        <TappletsGroupWrapper $category="Tapplets Registered">
            <TappletsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('Registered Tapplets')}</Typography>

                        <Count $count={registeredTappletsCount}>
                            <Typography>{registeredTappletsCount}</Typography>
                        </Count>
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
