import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import KeyIcon from './icons/KeyIcon';
import { Wrapper, TopBar, LineLeft, SectionLabel, LineRight, FormWrapper, InputField, SubmitButton } from './styles';
import { useAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest';
import { SosCoomieClaimResponse } from '@app/types/sosTypes';
import { useToastStore } from '@app/components/ToastStack/useToastStore';

export default function SuperCharger() {
    const { t } = useTranslation('sos', { useSuspense: false });
    const fetchHandler = useAirdropRequest();
    const { addToast } = useToastStore();
    const [code, setCode] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCode(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!code) return;

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
                addToast({
                    title: t('superCharger.success'),
                    type: 'success',
                });
            } else {
                addToast({
                    title: t('superCharger.error'),
                    type: 'error',
                });
            }
        });
        // TODO: handle loading and response states
    };

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
            </FormWrapper>
        </Wrapper>
    );
}
