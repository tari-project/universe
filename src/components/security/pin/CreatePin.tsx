import { FormProvider, useForm } from 'react-hook-form';
import { CTAWrapper, HelpWrapper, TextWrapper, Wrapper } from './styles.ts';

import { CodeInputValues, DEFAULT_PIN_LENGTH, PinInput } from './PinInput.tsx';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextButton } from '@app/components/elements/buttons/TextButton.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { StepChip } from '@app/containers/floating/security/common.styles.ts';
import { useExchangeStore } from '@app/store/useExchangeStore.ts';

const pinArr = Array.from({ length: DEFAULT_PIN_LENGTH }, (_, i) => i);
export default function CreatePin({ onClose, onSubmit }: { onClose?: () => void; onSubmit: (pin: string) => void }) {
    const isExchangeMiner = useExchangeStore((s) => s.currentExchangeMinerId !== 'universal');
    const { t } = useTranslation(['wallet', 'staged-security']);

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
            {!isExchangeMiner && <StepChip>{t('staged-security:steps.chip', { step: 2, total: 2 })}</StepChip>}
            <Wrapper onSubmit={methods.handleSubmit(handleSubmit)}>
                <TextWrapper>
                    <Typography variant="h5">{t('security.pin.creation-title', { context })}</Typography>
                    <Typography variant="p">{t('security.pin.creation-subtitle', { context })}</Typography>
                </TextWrapper>
                <PinInput isConfirm={isConfirm} hasError={noMatch} />
                {!isConfirm && <HelpWrapper>{t('security.pin.explainer')}</HelpWrapper>}
                {isConfirm && noMatch && <HelpWrapper>{t('security.pin.error-match')}</HelpWrapper>}

                <CTAWrapper>
                    <Button size="xlarge" disabled={submitDisabled} type="submit" fluid variant="black">
                        {t('security.pin.create', { context })}
                    </Button>
                    <TextButton onClick={handleSecondary}>
                        {t('security.pin.enter', { context: isConfirm ? 'new' : 'skip' })}
                    </TextButton>
                </CTAWrapper>
            </Wrapper>
        </FormProvider>
    );
}
