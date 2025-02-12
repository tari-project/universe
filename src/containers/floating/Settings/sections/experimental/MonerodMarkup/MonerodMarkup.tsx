import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import { ToggleSwitch } from '@app/components/elements/ToggleSwitch.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography';
import { IoAddCircleOutline, IoRemoveCircleOutline } from 'react-icons/io5';

import { Stack } from '@app/components/elements/Stack.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';

import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { IconButton } from '@app/components/elements/buttons/IconButton';
import { NodesSettingsContainer, StyledInput } from './MonerodMarkup.styles';

import {
    SettingsGroup,
    SettingsGroupAction,
    SettingsGroupContent,
    SettingsGroupTitle,
    SettingsGroupWrapper,
} from '../../../components/SettingsGroup.styles.ts';
import { setDialogToShow, setMonerodConfig } from '@app/store';

interface FormValues {
    use_monero_fail: boolean;
    monero_nodes: string[];
}

const node_url_regex = /^(https?:\/\/[a-zA-Z0-9.-]+(:\d{1,5})?)(\/.*)?$/;

const MonerodMarkup = () => {
    const { t } = useTranslation('settings', { useSuspense: false });
    const use_monero_fail = useAppConfigStore((s) => Boolean(s.mmproxy_use_monero_fail));
    const monero_nodes = useAppConfigStore((s) => s.mmproxy_monero_nodes || []);

    const {
        control,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        mode: 'onBlur',
        defaultValues: { use_monero_fail, monero_nodes },
    });
    const { fields, append, remove } = useFieldArray({
        control,
        // @ts-expect-error: use string[]
        name: 'monero_nodes',
    });

    const form_use_monero_fail = watch('use_monero_fail');
    const form_monero_nodes = watch('monero_nodes');

    const isSaveButtonVisible =
        (form_use_monero_fail !== use_monero_fail ||
            JSON.stringify(form_monero_nodes) !== JSON.stringify(monero_nodes)) &&
        !errors.monero_nodes?.length;

    const onSave = async (formValues: FormValues) => {
        setMonerodConfig(formValues.use_monero_fail, formValues.monero_nodes).then(() => {
            setDialogToShow('restart');
        });
    };

    return (
        <SettingsGroupWrapper>
            <SettingsGroup>
                <SettingsGroupContent>
                    <SettingsGroupTitle>
                        <Typography variant="h6">
                            <Trans>{t('use-dynamic-fail-data')}</Trans>
                            <b>&nbsp;({t('app-restart-required').toUpperCase()})</b>
                        </Typography>
                    </SettingsGroupTitle>
                    <Typography>{t('set-dynamic-fail-data')}</Typography>
                </SettingsGroupContent>
                <SettingsGroupAction>
                    {isSaveButtonVisible ? (
                        <Button onClick={handleSubmit(onSave)}>{t('save')}</Button>
                    ) : (
                        <Controller
                            name="use_monero_fail"
                            control={control}
                            render={({ field }) => {
                                const { ref: _ref, value, ...rest } = field;
                                return <ToggleSwitch checked={value} {...rest} />;
                            }}
                        />
                    )}
                </SettingsGroupAction>
            </SettingsGroup>

            {!form_use_monero_fail ? (
                <NodesSettingsContainer>
                    {fields.map((field, index) => (
                        <Stack key={field.id} direction="row" alignItems="center" style={{ margin: '4px 0' }}>
                            <Controller
                                key={field.id}
                                name={`monero_nodes.${index}`}
                                control={control}
                                rules={{
                                    pattern: {
                                        value: node_url_regex,
                                        message: 'Invalid node url',
                                    },
                                }}
                                render={({ field }) => {
                                    const { ref: _ref, ...rest } = field;
                                    return (
                                        <StyledInput
                                            placeholder="https://example.com"
                                            hasError={!!errors?.monero_nodes?.[index]}
                                            {...rest}
                                        />
                                    );
                                }}
                            />
                            {fields.length > 1 && (
                                <IconButton onClick={() => remove(index)}>
                                    <IoRemoveCircleOutline color="red" size={20} />
                                </IconButton>
                            )}
                        </Stack>
                    ))}
                    <IconButton onClick={() => append('')}>
                        <IoAddCircleOutline color="green" size={20} />
                    </IconButton>
                </NodesSettingsContainer>
            ) : null}
        </SettingsGroupWrapper>
    );
};

export default MonerodMarkup;
