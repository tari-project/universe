import { useEffect } from 'react';
import { Controller, useForm, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { BasePoolData } from '@app/types/configs';
import { Input } from '@app/components/elements/inputs/Input';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { Button } from '@app/components/elements/buttons/Button';
import { Typography } from '@app/components/elements/Typography';
import { Stack } from '@app/components/elements/Stack';
import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../components/SettingsGroup.styles';

export interface PoolConfigurationProps<T extends FieldValues = BasePoolData> {
    poolConfig: T | undefined;
    onSave?: (updatedConfig: T) => void;
    onReset?: () => void;
    isReadOnly?: boolean;
    hiddenFields?: (keyof T)[];
}

// Utility function to transform field names | pool_name => Pool Name
const formatFieldLabel = (fieldName: string): string => {
    return fieldName
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Utility function to determine field type
const getFieldType = (value: unknown): 'string' | 'number' | 'boolean' => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'string';
};

export const PoolConfiguration = <T extends FieldValues = BasePoolData>({
    poolConfig,
    onSave,
    onReset,
    isReadOnly = false,
    hiddenFields = ['pool_name', 'pool_type', 'stats_url', 'pool_origin'] as (keyof T)[],
}: PoolConfigurationProps<T>) => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const {
        control,
        handleSubmit,
        reset,
        formState: { isDirty, errors },
    } = useForm<T>({
        mode: 'onBlur',
    });

    // When we select another pool or component mounts, reset form data
    useEffect(() => {
        if (poolConfig) {
            reset(poolConfig);
        }
    }, [poolConfig, reset]);

    // Just in case to avoid any weird issues
    // Handle case when poolConfig is undefined or null
    if (!poolConfig) {
        return (
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <Typography>{t('no-pool-configuration-available')}</Typography>
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        );
    }

    // Handle case when poolConfig has no fields (empty object)
    const configFields = Object.entries(poolConfig);
    if (configFields.length === 0) {
        return (
            <SettingsGroupWrapper>
                <SettingsGroup>
                    <SettingsGroupContent>
                        <Typography>{t('no-pool-configuration-available')}</Typography>
                    </SettingsGroupContent>
                </SettingsGroup>
            </SettingsGroupWrapper>
        );
    }

    const onSubmit = (data: T) => {
        onSave?.(data);
    };

    const renderFieldInput = (fieldName: keyof T, fieldType: string, hasError: boolean) => {
        switch (fieldType) {
            case 'boolean':
                return (
                    <Controller
                        name={fieldName as Path<T>}
                        control={control}
                        render={({ field }) => {
                            const { value: fieldValue, ...rest } = field;
                            return <ToggleSwitch checked={Boolean(fieldValue)} disabled={isReadOnly} {...rest} />;
                        }}
                    />
                );

            case 'number':
                return (
                    <Controller
                        name={fieldName as Path<T>}
                        control={control}
                        rules={{
                            validate: (value) => {
                                const numValue = Number(value);
                                return !isNaN(numValue) || t('please-enter-valid-number');
                            },
                        }}
                        render={({ field }) => {
                            const { value, ...rest } = field;
                            return (
                                <Input
                                    type="number"
                                    hasError={hasError}
                                    disabled={isReadOnly}
                                    value={value ?? 0}
                                    {...rest}
                                />
                            );
                        }}
                    />
                );

            case 'string':
            default:
                return (
                    <Controller
                        name={fieldName as Path<T>}
                        control={control}
                        render={({ field }) => {
                            const { value, ...rest } = field;
                            const label = formatFieldLabel(fieldName as string);

                            return (
                                <Input
                                    type="text"
                                    placeholder={`${t('enter')} ${label.toLowerCase()}`}
                                    hasError={hasError}
                                    disabled={isReadOnly}
                                    value={value ?? ''}
                                    {...rest}
                                />
                            );
                        }}
                    />
                );
        }
    };

    const renderField = (fieldName: keyof T, value: unknown) => {
        // Hide fields that are in the hiddenFields array
        if (hiddenFields.includes(fieldName)) {
            return null;
        }

        const fieldType = getFieldType(value);
        const label = formatFieldLabel(fieldName as string);
        const hasError = !!errors[fieldName];

        return (
            <SettingsGroup
                key={String(fieldName)}
                style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '8px' }}
            >
                <SettingsGroupTitle style={{ marginBottom: '4px' }}>
                    <Typography variant="h6">{label}</Typography>
                </SettingsGroupTitle>
                <SettingsGroupAction style={{ width: '100%' }}>
                    {renderFieldInput(fieldName, fieldType, hasError)}
                </SettingsGroupAction>
            </SettingsGroup>
        );
    };

    return (
        <>
            <Stack direction="column" gap={4}>
                {configFields.map(([fieldName, value]) => renderField(fieldName as keyof T, value))}

                {!isReadOnly && (onSave || onReset) && (
                    <SettingsGroup style={{ marginTop: '4px' }}>
                        <SettingsGroupContent />
                        <SettingsGroupAction style={{ display: 'flex', gap: '8px' }}>
                            {onReset && (
                                <Button variant="outlined" onClick={onReset}>
                                    {t('reset-to-defaults')}
                                </Button>
                            )}
                            {onSave && (
                                <Button variant="green" onClick={handleSubmit(onSubmit)} disabled={!isDirty}>
                                    {t('save-configuration')}
                                </Button>
                            )}
                        </SettingsGroupAction>
                    </SettingsGroup>
                )}
            </Stack>
        </>
    );
};
