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
        ? connectedPeers.map((peer, i) => (
              <Typography key={`peer-${peer}:${i}`}>
                  {i + 1}. {peer}
              </Typography>
          ))
        : null;
    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('connected-peers')}</Typography>
                    </SettingsGroupTitle>

                    <Stack style={{ padding: 10, fontSize: '11px', maxHeight: 200, overflowY: 'auto' }}>
                        {listMarkup}
                    </Stack>
                </SettingsGroupContent>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
