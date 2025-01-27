import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

import { Typography } from '@app/components/elements/Typography';

import { useTranslation } from 'react-i18next';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { useCallback } from 'react';
import { TappletsOverview } from './TappletsOverview';

export const OotleSettings = () => {
    const { t } = useTranslation(['settings', 'ootle'], { useSuspense: false });
    const ootleMode = useAppConfigStore((s) => s.ootle_enabled);
    const localIndexer = useAppConfigStore((s) => s.local_tari_indexer);

    const setOotleMode = useAppConfigStore((s) => s.setOotleMode);
    const setLocalTariIndexer = useAppConfigStore((s) => s.setLocalTariIndexer);

    const handleOotleSwitch = useCallback(() => {
        setOotleMode(!ootleMode);
    }, [ootleMode, setOotleMode]);

    const handleIndexerSwitch = useCallback(() => {
        setLocalTariIndexer(!localIndexer);
    }, [localIndexer, setLocalTariIndexer]);

    return (
        <>
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <SettingsGroupTitle>
                            <Typography variant="h6">{t('tabs.ootle', { ns: 'settings' })}</Typography>
                        </SettingsGroupTitle>
                        <Typography>{t('Enable or disable the Tari Ootle')}</Typography>
                    </SettingsGroupContent>
                    <SettingsGroupAction style={{ alignItems: 'center' }}>
                        <ToggleSwitch checked={ootleMode} onChange={handleOotleSwitch} />
                    </SettingsGroupAction>
                </SettingsGroup>
            </SettingsGroupWrapper>
            {ootleMode && (
                <>
                    <SettingsGroupWrapper>
                        <SettingsGroup>
                            <SettingsGroupContent>
                                <SettingsGroupTitle>
                                    <Typography variant="h6">{t('local-tari-indexer', { ns: 'ootle' })}</Typography>
                                </SettingsGroupTitle>
                                <Typography>{t('Run Tari Indexer locally')}</Typography>
                            </SettingsGroupContent>
                            <SettingsGroupAction style={{ alignItems: 'center' }}>
                                <ToggleSwitch checked={localIndexer} onChange={handleIndexerSwitch} />
                            </SettingsGroupAction>
                        </SettingsGroup>
                        <TappletsOverview />
                    </SettingsGroupWrapper>
                </>
            )}
        </>
    );
};
