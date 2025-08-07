import { IconImage, RightSide, Title, Wrapper } from './styles';
import coinImage from '../../../../../images/coin_solo.png';
import InviteFriendsButton from './InviteFriendsButton/InviteFriendsButton';
import ToggleIcon from './ToggleIcon/ToggleIcon';
import { useTranslation } from 'react-i18next';

export default function TopRow() {
    const { t } = useTranslation();

    return (
        <Wrapper>
            <Title>
                <IconImage src={coinImage} alt="" aria-hidden="true" /> {t('airdrop:crewRewards.title')}
            </Title>

            <RightSide>
                <InviteFriendsButton />
                <ToggleIcon />
            </RightSide>
        </Wrapper>
    );
}
