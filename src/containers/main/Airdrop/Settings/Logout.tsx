import { Button } from '@app/components/elements/buttons/Button';
import { Typography } from '@app/components/elements/Typography';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/floating/Settings/components/SettingsGroup.styles';

import { useAirdropStore } from '@app/store/useAirdropStore';
import { Trans, useTranslation } from 'react-i18next';
import { handleAirdropLogout } from '@app/store';

export default function AirdropLogout() {
    const { t } = useTranslation(['common', 'airdrop'], { useSuspense: false });

    const { authUuid, userDetails } = useAirdropStore();
    if (!userDetails && !authUuid) return null;
    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('connection')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent>
                    <Typography variant="p">
                        <Trans
                            i18nKey="logged-in-as"
                            ns="airdrop"
                            values={{ twitter: userDetails?.user.name }}
                            components={{ strong: <strong /> }}
                        />
                    </Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Button color="warning" size="small" onClick={() => handleAirdropLogout()}>
                        {t('disconnect')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
