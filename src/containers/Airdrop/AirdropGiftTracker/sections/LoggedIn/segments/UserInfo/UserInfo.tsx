import { useAirdropStore } from '@app/store/useAirdropStore';
import { Avatar, Info, Name, Rank, TrophyImage, Wrapper } from './styles';
import trophyImage from '../../../../images/trophy.png';

export default function UserInfo() {
    const { userDetails, userPoints } = useAirdropStore();

    const profileimageurl = userDetails?.user?.profileimageurl;
    const name = userDetails?.user?.name;
    const rank = userPoints?.base.rank || userDetails?.user?.rank?.rank || '0';

    return (
        <Wrapper>
            <Avatar $image={profileimageurl} />
            <Info>
                <Name>@{name}</Name>
                <Rank>
                    <TrophyImage src={trophyImage} alt="" /> {parseInt(rank).toLocaleString()}
                </Rank>
            </Info>
        </Wrapper>
    );
}
