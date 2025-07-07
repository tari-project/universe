import { FormProvider, useForm } from 'react-hook-form';
import { CTAWrapper, FormCTA, HelpWrapper, TextWrapper, Wrapper } from './styles.ts';
import { CodeInputValues, DEFAULT_PIN_LENGTH, PinInput } from './PinInput.tsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

const pinArr = Array.from({ length: DEFAULT_PIN_LENGTH }, (_, i) => i);
export default function CreatePin({ onClose, onSubmit }: { onClose?: () => void; onSubmit: (pin: string) => void }) {
    const { t } = useTranslation('wallet');

    const [isConfirm, setIsConfirm] = useState(false);
    const [initialCode, setInitialCode] = useState('');
    const [noMatch, setNoMatch] = useState(false);

    const methods = useForm({
        defaultValues: { code: pinArr.map((_) => ({ digit: '' })) },
    });

    const currentDigits = methods.watch('code');
    const currentCode = currentDigits.map(({ digit }) => digit).join('');

    function handleSubmit(data: CodeInputValues) {
        const codeValue = data.code.map(({ digit }) => digit).join('');
        if (!isConfirm) {
            // set code
            setInitialCode(codeValue);
            setIsConfirm(true);
            methods.reset();
        } else {
            onSubmit(codeValue);
        }
    }

    function handleSecondary() {
        if (isConfirm) {
            setInitialCode('');
            setIsConfirm(false);
            setNoMatch(false);
        } else {
            onClose?.();
        }
        methods.reset();
    }

    useEffect(() => {
        if (!isConfirm) return;

        const isLength = currentCode.length === DEFAULT_PIN_LENGTH;
        const isMatch = currentCode === initialCode;
        setNoMatch(isLength ? !isMatch : false);
    }, [currentCode, initialCode, isConfirm]);

    const context = !isConfirm ? '' : 'confirm';
    const submitDisabled = currentCode.length !== DEFAULT_PIN_LENGTH || (isConfirm && noMatch);

    return (
        <FormProvider {...methods}>
            <Wrapper onSubmit={methods.handleSubmit(handleSubmit)}>
                <TextWrapper>
                    <Typography variant="h5">{t('security.pin.creation-title', { context })}</Typography>
                    <Typography variant="p">{t('security.pin.creation-subtitle', { context })}</Typography>
                </TextWrapper>
                <PinInput hasError={noMatch} />
                {!isConfirm && (
                    <HelpWrapper>
                        {`If you forget this PIN, the only way to regain access to your wallet is by restoring it from your seed phrase.`}
                    </HelpWrapper>
                )}
                {isConfirm && noMatch && (
                    <HelpWrapper>{`That’s not quite right. Try again or create a new PIN.`}</HelpWrapper>
                )}

                <CTAWrapper>
                    <FormCTA fluid disabled={submitDisabled} type="submit">
                        {t('security.pin.create', { context })}
                    </FormCTA>
                    <TextButton onClick={handleSecondary}>
                        {t('security.pin.enter', { context: isConfirm ? 'new' : 'skip' })}
                    </TextButton>
                </CTAWrapper>
            </Wrapper>
        </FormProvider>
    );
}
