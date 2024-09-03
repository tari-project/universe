import { Switch } from '@mui/material';
import { BoxWrapper, Text, TextWrapper, Title, Wrapper } from './styles';
import { useState, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';

export default function AirdropPermissionSettings() {
    const [checked, setChecked] = useState(false);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
    };

    return (
        <Wrapper>
            <BoxWrapper>
                <TextWrapper>
                    <Title>{t('permission.title')}</Title>
                    <Text>{t('permission.text')}</Text>
                </TextWrapper>
                <Switch checked={checked} onChange={handleChange} color="primary" size="medium" />
            </BoxWrapper>
        </Wrapper>
    );
}
