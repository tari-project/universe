import { useAirdropStore } from '@app/store/useAirdropStore';
import { Avatar, Info, Name, Wrapper } from './styles';
import { useAvatarGradient } from '@app/hooks/airdrop/utils/useAvatarGradient';

export default function UserInfo() {
    const { userDetails } = useAirdropStore();

    const profileimageurl = userDetails?.user?.profileimageurl;
    const name = userDetails?.user?.name;

    const style = useAvatarGradient({ username: name || '', image: profileimageurl });

    return (
        <Wrapper>
            <Avatar style={style} />
            {name ? (
                <Info>
                    <Name>@{name}</Name>
                </Info>
            ) : null}
        </Wrapper>
    );
}
