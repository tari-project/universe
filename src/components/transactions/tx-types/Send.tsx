import { TabContentWrapper } from '@app/components/transactions/WalletSidebarContent.styles.ts';
import { TxInput, TxInputProps } from '@app/components/transactions/components/TxInput.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { useForm } from 'react-hook-form';
import { StyledForm } from '@app/components/transactions/tx-types/tx.styles.ts';
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CircularProgress } from '@app/components/elements/CircularProgress.tsx';

const fields: TxInputProps[] = [
    { name: 'tx_message', placeholder: 'Payment message' },
    { name: 'tx_address', placeholder: 'Wallet address' },
    { name: 'tx_amount', placeholder: 'Amount', icon: <TariOutlineSVG /> },
];

interface SendInputs {
    tx_message: string;
    tx_address: string;
    tx_amount: string;
}

type InputName = keyof SendInputs;

export function Send() {
    const {
        register,
        handleSubmit,
        setValue,
        formState: { isSubmitting },
    } = useForm<SendInputs>({
        shouldUseNativeValidation: true,
        defaultValues: { tx_message: 'string', tx_address: 'string', tx_amount: 'string' },
    });

    const fieldMarkup = fields.map(({ name, placeholder, ...rest }) => {
        const fieldName = name as InputName;

        return (
            <TxInput
                key={name}
                {...register(fieldName)}
                name={name}
                onChange={(e) => setValue(fieldName, e.target.value)}
                placeholder={placeholder}
                {...rest}
            />
        );
    });

    const handleSend = useCallback(async (data) => {
        await invoke('send_one_sided_to_stealth_address', {
            amount: data.tx_amount,
            destination: data.tx_address,
            payment_id: data.tx_message,
        });
    }, []);

    return (
        <TabContentWrapper>
            <StyledForm onSubmit={handleSubmit(handleSend)}>
                {fieldMarkup}
                <Stack alignItems="flex-end" justifyContent="flex-end" direction="row" style={{ width: `100%` }}>
                    <Button size="xs" variant="outlined" type="button">{`Max`}</Button>
                </Stack>
                {isSubmitting && <CircularProgress />}
                <Button disabled={isSubmitting} type="submit">
                    {`send`}
                </Button>
            </StyledForm>
        </TabContentWrapper>
    );
}
