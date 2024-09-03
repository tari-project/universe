import { Switch } from '@mui/material';
import { BoxWrapper, Gem1, Gem2, Gem3, Gem4, Position, Text, TextWrapper, Title } from './styles';
import { useState, ChangeEvent } from 'react';
import gemImage from './images/gem.png';

export default function AirdropPermission() {
    const [checked, setChecked] = useState(false);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setChecked(event.target.checked);
    };

    return (
        <Position>
            <BoxWrapper>
                <Gem1 src={gemImage} alt="" />
                <Gem2 src={gemImage} alt="" />
                <Gem3 src={gemImage} alt="" />
                <Gem4 src={gemImage} alt="" />

                <TextWrapper>
                    <Title>Earn Gems & make Tari Universe better</Title>
                    <Text>
                        Tari Universe would like to use analytics to improve your experience and reward you with gems
                        for mining.
                    </Text>
                </TextWrapper>
                <Switch checked={checked} onChange={handleChange} color="primary" size="medium" />
            </BoxWrapper>
        </Position>
    );
}
