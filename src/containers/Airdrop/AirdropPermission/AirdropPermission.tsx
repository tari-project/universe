import { Switch } from '@mui/material';
import { BoxWrapper, Gem1, Gem2, Gem3, Gem4, Position, Text, TextWrapper, Title } from './styles';
import { useState, ChangeEvent } from 'react';
import gemImage from './images/gem.png';
import { useTranslation } from 'react-i18next';
import { useAirdropStore } from '@app/store/useAirdropStore';

export default function AirdropPermission() {
    const [checked, setChecked] = useState(false);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });

    const { setShowLoginAlert } = useAirdropStore();

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);

        if (event.target.checked) {
            setShowLoginAlert(true);
        }
    };

    return (
        <Position>
            <BoxWrapper>
                <Gem1 src={gemImage} alt="" />
                <Gem2 src={gemImage} alt="" />
                <Gem3 src={gemImage} alt="" />
                <Gem4 src={gemImage} alt="" />

                <TextWrapper>
                    <Title>{t('permission.title')}</Title>
                    <Text>{t('permission.text')}</Text>
                </TextWrapper>
                <Switch checked={checked} onChange={handleChange} color="primary" size="medium" />
            </BoxWrapper>
        </Position>
    );
}
