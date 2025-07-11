import { useTranslation } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { CodeInputValues, DEFAULT_PIN_LENGTH, PinInput } from './PinInput.tsx';
import { CTAWrapper, Wrapper } from './styles.ts';
import { CTA } from '../styles.ts';

const pinArr = Array.from({ length: DEFAULT_PIN_LENGTH }, (_, i) => i);

interface EnterPinProps {
    onForgot?: () => void;
    onSubmit: (pin: string) => void;
}
export default function EnterPin({ onForgot, onSubmit }: EnterPinProps) {
    const { t } = useTranslation('wallet');
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
        onForgot?.();
        methods.reset();
    }

    return (
        <FormProvider {...methods}>
            <Wrapper onSubmit={methods.handleSubmit(handleSubmit)}>
                <PinInput />
                <CTAWrapper>
                    <CTA fluid disabled={currentCode.length !== DEFAULT_PIN_LENGTH} type="submit">
                        {t('security.pin.enter')}
                    </CTA>
                    <TextButton color="greyscale" onClick={handleForgot}>
                        {t('security.pin.forgot')}
                    </TextButton>
                </CTAWrapper>
            </Wrapper>
        </FormProvider>
    );
}
