import { useTranslation } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { CodeInputValues, DEFAULT_PIN_LENGTH, PinInput } from './PinInput.tsx';
import { CTAWrapper, Wrapper } from './styles.ts';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { emit } from '@tauri-apps/api/event';
import { useSecurityStore } from '@app/store';

const pinArr = Array.from({ length: DEFAULT_PIN_LENGTH }, (_, i) => i);

interface EnterPinProps {
    onSubmit: (pin: string) => void;
}
export default function EnterPin({ onSubmit }: EnterPinProps) {
    const { t } = useTranslation('wallet');
    const setModal = useSecurityStore((s) => s.setModal);
    const methods = useForm({
        defaultValues: { code: pinArr.map((_) => ({ digit: '' })) },
    });

    const currentDigits = methods.watch('code');
    const currentCode = currentDigits.map(({ digit }) => digit).join('');

    function handleSubmit(data: CodeInputValues) {
        const codeValue = data.code.map(({ digit }) => digit).join('');
        onSubmit(codeValue);
    }

    function handleForgot() {
        // close backend listener for entering the pin
        emit('pin-dialog-response', { pin: undefined }).then(() => {
            setModal('forgot_pin');
            methods.reset();
        });
    }

    return (
        <FormProvider {...methods}>
            <Wrapper onSubmit={methods.handleSubmit(handleSubmit)}>
                <PinInput autoSubmitFn={methods.handleSubmit(handleSubmit)} />
                <CTAWrapper>
                    <Button
                        variant="black"
                        fluid
                        size="xlarge"
                        disabled={currentCode.length !== DEFAULT_PIN_LENGTH}
                        type="submit"
                    >
                        {t('security.pin.enter')}
                    </Button>
                    <TextButton color="greyscale" onClick={handleForgot}>
                        {t('security.pin.forgot')}
                    </TextButton>
                </CTAWrapper>
            </Wrapper>
        </FormProvider>
    );
}
