import {
    SettingsGroup,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '@app/containers/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { Stack } from '@app/components/elements/Stack.tsx';

export default function Peers() {
    const { t } = useTranslation('settings');
    const connectedPeers = useMiningStore((state) => state.base_node?.connected_peers || []);

    const listMarkup = connectedPeers?.length
        ? connectedPeers.map((peer, i) => <li key={`peer-${peer}:${i}`}>{peer}</li>)
        : null;
    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('connected-peers')}</Typography>
                    </SettingsGroupTitle>

                    <Stack style={{ fontSize: '12px' }}>
                        <ol>{listMarkup}</ol>
                    </Stack>
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
