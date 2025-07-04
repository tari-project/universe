import { FormProvider, useForm } from 'react-hook-form';
import { FormCTA, TextWrapper, Wrapper } from './styles.ts';
import { CodeInputValues, DEFAULT_PIN_LENGTH, PinInput } from './PinInput.tsx';
import { useTranslation } from 'react-i18next';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

const pinArr = Array.from({ length: DEFAULT_PIN_LENGTH }, (_, i) => i);

export default function EnterPin({ onForgot, onSubmit }: { onForgot?: () => void; onSubmit: (pin: string) => void }) {
    const { t } = useTranslation('wallet');
    const methods = useForm({
        defaultValues: { code: pinArr.map((_) => ({ digit: '' })) },
    });

    function handleSubmit(data: CodeInputValues) {
        const codeValue = data.code.map(({ digit }) => digit).join('');
        onSubmit(codeValue);
    }

    function handleForgot() {
        onForgot?.();
        methods.reset();
    }

    return (
        <FormProvider {...methods}>
            <Wrapper onSubmit={methods.handleSubmit(handleSubmit)}>
                <TextWrapper>
                    <Typography variant="h5">{t('security.pin.enter')}</Typography>
                </TextWrapper>
                <PinInput />
                <FormCTA fluid disabled={false} type="submit">
                    {t('security.pin.enter')}
                </FormCTA>
                <TextButton color="greyscale" onClick={handleForgot}>
                    {t('security.pin.forgot')}
                </TextButton>
            </Wrapper>
        </FormProvider>
    );
}
