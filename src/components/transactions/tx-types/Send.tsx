import { TabContentWrapper } from '@app/components/transactions/WalletSidebarContent.styles.ts';
import { TxInput, TxInputProps } from '@app/components/transactions/components/TxInput.tsx';
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { Stack } from '@app/components/elements/Stack.tsx';
import { Controller, useForm } from 'react-hook-form';

const fields: TxInputProps[] = [
    { name: 'tx_message', placeholder: 'Payment message' },
    { name: 'tx_address', placeholder: 'Wallet address' },
    { name: 'tx_amount', placeholder: 'Amount', type: 'number', icon: <TariOutlineSVG /> },
];

export function Send() {
    const { control } = useForm<TxInputProps>({
        shouldUseNativeValidation: true,
    });

    const fieldMarkup = fields.map(({ name, placeholder, ...rest }) => {
        return (
            <Controller
                key={name}
                name="name"
                control={control}
                render={({ field, formState, fieldState }) => (
                    <TxInput id={field.name} name={field.name} placeholder={placeholder} {...rest} />
                )}
            />
        );
    });
    return (
        <TabContentWrapper>
            {fieldMarkup}
            <Stack alignItems="flex-end" justifyContent="flex-end" direction="row" style={{ width: `100%` }}>
                <Button size="xs" variant="outlined">{`Max`}</Button>
            </Stack>
        </TabContentWrapper>
    );
}
