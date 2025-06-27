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
import { Input } from '@app/components/elements/inputs/Input';
import { useState, useTransition } from 'react';
import { handleUsernameChange } from '@app/store/actions/airdropStoreActions';
import { ErrorText, InputWrapper } from './styles';
import { addToast } from '@app/components/ToastStack/useToastStore';
import { setIsSettingsOpen } from '@app/store';

export default function AirdropLogout() {
    const { t } = useTranslation(['common', 'airdrop'], { useSuspense: false });
    const authUuid = useAirdropStore((s) => s.authUuid);
    const userDetails = useAirdropStore((s) => s.userDetails);
    const [isPending, startTransition] = useTransition();

    const [username, setUsername] = useState(userDetails?.user.name || '');
    const [error, setError] = useState('');

    const handleUpdateUsername = () => {
        if (!username) return;

        startTransition(async () => {
            // Basic validation - example pattern for alphanumeric + some special chars
            const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/;
            if (!usernamePattern.test(username)) {
                setError(t('username-error', { ns: 'airdrop' }));

                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await handleUsernameChange(username, async (response: any) => {
                const res = await response?.json();
                setError(res?.message || '');
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }).then((res: any) => {
                if (res?.success) {
                    setIsSettingsOpen(false);
                    setError('');
                    addToast({
                        title: t('success', { ns: 'airdrop' }),
                        text: t('username-update-success', { ns: 'airdrop' }),
                        type: 'success',
                    });
                }
            });
        });
    };

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
                    <Button color="warning" onClick={() => handleAirdropLogout()}>
                        {t('disconnect')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('airdrop:update-username')}</Typography>
            </SettingsGroupTitle>
            <SettingsGroup>
                <SettingsGroupContent>
                    <InputWrapper>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isPending}
                            hasError={!!error}
                        />
                    </InputWrapper>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Button color="warning" onClick={handleUpdateUsername} disabled={isPending}>
                        {t('update')}
                    </Button>
                </SettingsGroupAction>
            </SettingsGroup>
            {error && <ErrorText>{error}</ErrorText>}
        </SettingsGroupWrapper>
    );
}
