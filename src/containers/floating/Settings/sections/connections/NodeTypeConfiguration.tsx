import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

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
import { setNodeType, setRemoteBaseNodeAddress } from '@app/store/actions/config/core.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import {
    AddressErrorMessage,
    AddressFieldLabel,
    AddressFieldWrapper,
    AddressInput,
} from './NodeTypeConfiguration.styles.ts';

export default function NodeTypeConfiguration() {
    const { t } = useTranslation(['settings'], { useSuspense: false });
    const node_type = useConfigCoreStore((s) => s.node_type || 'Local');
    const remote_base_node_address = useConfigCoreStore((s) => s.remote_base_node_address || '');
    const [addressInput, setAddressInput] = useState(remote_base_node_address);
    const [addressError, setAddressError] = useState<string | null>(null);

    const addressInputId = useId();
    const addressErrorId = useId();

    const showAddressInput = node_type === 'Remote' || node_type === 'RemoteUntilLocal';

    useEffect(() => {
        setAddressInput(remote_base_node_address);
    }, [remote_base_node_address]);

    const handleChange = useCallback(async (nodeType: string) => {
        await setNodeType(nodeType as NodeType);
    }, []);

    const handleAddressBlur = useCallback(async () => {
        const trimmed = addressInput.trim();
        if (trimmed === remote_base_node_address) {
            setAddressError(null);
            return;
        }

        // Validate via the backend so inline errors use the exact same
        // rules — scheme, explicit port, no path/query/userinfo — that
        // `set_remote_base_node_address` will apply when it persists.
        try {
            await invoke<string>('validate_remote_base_node_address', { address: trimmed });
        } catch (e) {
            const message = typeof e === 'string' ? e : e instanceof Error ? e.message : String(e);
            console.warn('Remote base node address failed validation:', message);
            setAddressError(message || t('custom-remote-node-address-error'));
            return;
        }

        setAddressError(null);
        try {
            await setRemoteBaseNodeAddress(trimmed);
        } catch (e) {
            const message = typeof e === 'string' ? e : e instanceof Error ? e.message : String(e);
            setAddressError(message || t('custom-remote-node-address-error'));
        }
    }, [addressInput, remote_base_node_address, t]);

    const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setAddressInput(e.target.value);
        setAddressError(null);
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
                        <AddressFieldWrapper>
                            <AddressFieldLabel htmlFor={addressInputId}>
                                {t('custom-remote-node-address')}
                            </AddressFieldLabel>
                            <AddressInput
                                id={addressInputId}
                                name="remote-node-address"
                                type="url"
                                inputMode="url"
                                autoComplete="off"
                                spellCheck={false}
                                placeholder="https://grpc.tari.com:443"
                                value={addressInput}
                                onChange={handleAddressChange}
                                onBlur={handleAddressBlur}
                                onKeyDown={handleAddressKeyDown}
                                $hasError={Boolean(addressError)}
                                aria-invalid={Boolean(addressError)}
                                aria-describedby={addressError ? addressErrorId : undefined}
                            />
                            {addressError && (
                                <AddressErrorMessage id={addressErrorId} role="alert">
                                    {t('custom-remote-node-address-error')}
                                </AddressErrorMessage>
                            )}
                        </AddressFieldWrapper>
                    </SettingsGroupContent>
                </SettingsGroup>
            )}
        </SettingsGroupWrapper>
    );
}
