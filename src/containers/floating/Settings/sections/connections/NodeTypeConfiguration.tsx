import { useCallback, useMemo } from 'react';

import { Typography } from '@app/components/elements/Typography.tsx';

import { useTranslation } from 'react-i18next';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles.ts';
import { Select, SelectOption } from '@app/components/elements/inputs/Select.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { offset } from '@floating-ui/react';
import { NodeType } from '@app/types/mining/node.ts';
import { setNodeType } from '@app/store/actions/config/core.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';

export default function NodeTypeConfiguration() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const node_type = useConfigCoreStore((s) => s.node_type || 'Local');

    const handleChange = useCallback(async (nodeType: string) => {
        await setNodeType(nodeType as NodeType);
    }, []);

    const tabOptions: SelectOption[] = useMemo(
        () => [
            { label: 'Local', value: 'Local' },
            { label: 'Remote', value: 'Remote' },
            { label: 'Remote & Local', value: 'RemoteUntilLocal' },
        ],
        []
    );

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">{t('node-configuration')}</Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('node-configuration-description')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    <Stack style={{ width: '100%', minWidth: 160 }}>
                        <Select
                            onChange={handleChange}
                            forceHeight={36}
                            selectedValue={node_type}
                            options={tabOptions}
                            floatingProps={{
                                middleware: [offset({ crossAxis: -40, mainAxis: 10 })],
                            }}
                            variant="bordered"
                        />
                    </Stack>
                </SettingsGroupAction>
            </SettingsGroup>
        </SettingsGroupWrapper>
    );
}
