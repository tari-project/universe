import { Typography } from '@app/components/elements/Typography';
import {
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';

import { useAirdropStore } from '@app/store/useAirdropStore';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { Trans, useTranslation } from 'react-i18next';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';

export default function AirdropLogout() {
    const { t } = useTranslation(['common', 'airdrop'], { useSuspense: false });

    const airdropUIEnabled = useAppConfigStore((s) => s.airdrop_ui_enabled);
    const logout = useAirdropStore((state) => state.logout);
    const { authUuid, userDetails } = useAirdropStore();
    if (!airdropUIEnabled || (!userDetails && !authUuid)) return null;
    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('connection')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroupContent>
                <Typography variant="p">
                    <Trans
                        i18nKey="logged-in-as"
                        ns="airdrop"
                        values={{ twitter: userDetails?.user.name }}
                        components={{ strong: <strong /> }}
                    />
                </Typography>
                <div style={{ maxWidth: 'fit-content', marginLeft: 'auto', padding: '20px' }}>
                    <TextButton color="error" colorIntensity={400} size="medium" onClick={logout}>
                        {t('disconnect')}
                    </TextButton>
                </div>
            </SettingsGroupContent>
        </SettingsGroupWrapper>
    );
}
