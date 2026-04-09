import { useCallback, useEffect, useMemo, useState } from 'react';

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
import { StyledInput } from '@app/components/elements/inputs/Input.styles.ts';
import { Stack } from '@app/components/elements/Stack.tsx';
import { offset } from '@floating-ui/react';
import { NodeType } from '@app/types/mining/node.ts';
import { setNodeType, setRemoteBaseNodeAddress } from '@app/store/actions/config/core.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';

export default function NodeTypeConfiguration() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const node_type = useConfigCoreStore((s) => s.node_type || 'Local');
    const remote_base_node_address = useConfigCoreStore((s) => s.remote_base_node_address || '');
    const [addressInput, setAddressInput] = useState(remote_base_node_address);
    const [addressError, setAddressError] = useState(false);

    const showAddressInput = node_type === 'Remote' || node_type === 'RemoteUntilLocal';

    useEffect(() => {
        setAddressInput(remote_base_node_address);
    }, [remote_base_node_address]);

    const handleChange = useCallback(async (nodeType: string) => {
        await setNodeType(nodeType as NodeType);
    }, []);

    const handleAddressBlur = useCallback(async () => {
        const trimmed = addressInput.trim();
        if (trimmed === remote_base_node_address) return;

        if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            setAddressError(true);
            return;
        }

        setAddressError(false);
        await setRemoteBaseNodeAddress(trimmed);
    }, [addressInput, remote_base_node_address]);

    const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setAddressInput(e.target.value);
        setAddressError(false);
    }, []);

    const handleAddressKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                handleAddressBlur();
            }
        },
        [handleAddressBlur]
    );

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
            {showAddressInput && (
                <SettingsGroup style={{ paddingTop: 0 }}>
                    <SettingsGroupContent style={{ width: '100%' }}>
                        <Typography variant="span" style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                            {t('custom-remote-node-address')}
                        </Typography>
                        <StyledInput
                            name="remote-node-address"
                            placeholder="https://grpc.tari.com:443"
                            value={addressInput}
                            onChange={handleAddressChange}
                            onBlur={handleAddressBlur}
                            onKeyDown={handleAddressKeyDown}
                            $hasError={addressError}
                            style={{ width: '100%', fontSize: 13 }}
                        />
                        {addressError && (
                            <Typography variant="span" style={{ fontSize: 11, color: '#ff4444', marginTop: 2 }}>
                                {t('custom-remote-node-address-error')}
                            </Typography>
                        )}
                    </SettingsGroupContent>
                </SettingsGroup>
            )}
        </SettingsGroupWrapper>
    );
}
