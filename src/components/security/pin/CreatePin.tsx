import { FormProvider, useForm } from 'react-hook-form';
import { FormCTA, TextWrapper, Wrapper } from './styles.ts';
import { CodeInputValues, DEFAULT_PIN_LENGTH, PinInput } from './PinInput.tsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

const pinArr = Array.from({ length: DEFAULT_PIN_LENGTH }, (_, i) => i);
export default function CreatePin({ onClose }: { onClose?: () => void }) {
    const { t } = useTranslation('wallet');
    const [initialCode, setInitialCode] = useState('');
    const [codeMatches, setCodeMatches] = useState(false);
    const methods = useForm({
        defaultValues: { code: pinArr.map((_) => ({ digit: '' })) },
    });

    const isConfirm = !!initialCode.length;

    function onSubmit(data: CodeInputValues) {
        const codeValue = data.code.map(({ digit }) => digit).join('');
        console.debug(`codeValue= `, codeValue);
        console.debug(`isConfirm= `, isConfirm);
        if (!isConfirm) {
            // set code
            setInitialCode(codeValue);
            methods.reset();
        } else {
            setCodeMatches(codeValue === initialCode);
        }
    }

    function handleSecondary() {
        if (isConfirm) {
            setInitialCode('');
        } else {
            onClose?.();
        }
        methods.reset();
    }

    const context = !isConfirm ? '' : 'confirm';

    return (
        <FormProvider {...methods}>
            <Wrapper onSubmit={methods.handleSubmit(onSubmit)}>
                <TextWrapper>
                    <Typography variant="h5">{t('security.pin.creation-title', { context })}</Typography>
                    <Typography variant="p">{t('security.pin.creation-subtitle', { context })}</Typography>
                </TextWrapper>
                <PinInput />
                <FormCTA fluid disabled={false} type="submit">
                    {t('security.pin.create', { context })}
                </FormCTA>
                <TextButton color="greyscale" onClick={handleSecondary}>
                    {t('security.pin.enter', { context: isConfirm ? 'new' : 'skip' })}
                </TextButton>
            </Wrapper>
            {isConfirm && !codeMatches && <p>{`Codes do not match`}</p>}
        </FormProvider>
    );
}
