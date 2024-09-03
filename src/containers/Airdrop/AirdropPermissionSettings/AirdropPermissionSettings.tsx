import { Switch } from '@mui/material';
import { BoxWrapper, Text, TextWrapper, Title, Wrapper } from './styles';
import { useState, ChangeEvent } from 'react';

export default function AirdropPermissionSettings() {
    const [checked, setChecked] = useState(false);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
    };

    return (
        <Wrapper>
            <BoxWrapper>
                <TextWrapper>
                    <Title>Earn Gems & make Tari Universe better</Title>
                    <Text>
                        Tari Universe would like to use analytics to improve your experience and reward you with gems
                        for mining.
                    </Text>
                </TextWrapper>
                <Switch checked={checked} onChange={handleChange} color="primary" size="medium" />
            </BoxWrapper>
        </Wrapper>
    );
}
