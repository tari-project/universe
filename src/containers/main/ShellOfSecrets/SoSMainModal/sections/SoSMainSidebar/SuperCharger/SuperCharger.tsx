import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import KeyIcon from './icons/KeyIcon';
import {
    Wrapper,
    TopBar,
    LineLeft,
    SectionLabel,
    LineRight,
    FormWrapper,
    InputField,
    SubmitButton,
    SuccessMessage,
    ErrorMessage,
} from './styles';
import { useAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import { SosCoomieClaimResponse } from '@app/types/sosTypes';
import { sosFormatAwardedBonusTime } from '@app/utils';

export default function SuperCharger() {
    const { t } = useTranslation('sos', { useSuspense: false });
    const fetchHandler = useAirdropRequest();
    const [code, setCode] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCode(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!code) return;
        setSuccessMessage('');
        setError('');

        fetchHandler<SosCoomieClaimResponse>({
            path: '/sos/cookie/claim',
            method: 'POST',
            body: {
                cookieCode: code,
            },
        }).then((response) => {
            setCode('');
            // TODO add some feedback
            if (response?.success) {
                const time = sosFormatAwardedBonusTime(response.addedTimeBonus);
                setSuccessMessage(t('superCharger.success', { time }));
            } else {
                setError(t('superCharger.error'));
            }
        });
        // TODO: handle loading and response states
    };

    useEffect(() => {
        if (successMessage) {
            const timeout = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timeout);
        }
    }, [successMessage]);

    return (
        <Wrapper>
            <TopBar>
                <LineLeft />
                <SectionLabel>{t('superCharger.title')}</SectionLabel>
                <LineRight />
            </TopBar>

            <FormWrapper onSubmit={handleSubmit}>
                <KeyIcon />

                <InputField placeholder={t('superCharger.placeholder')} value={code} onChange={handleChange} />

                <SubmitButton>{t('superCharger.submit')}</SubmitButton>
                <SuccessMessage $visible={!!successMessage}>{successMessage}</SuccessMessage>
                <ErrorMessage $visible={!!error}>{error}</ErrorMessage>
            </FormWrapper>
        </Wrapper>
    );
}
