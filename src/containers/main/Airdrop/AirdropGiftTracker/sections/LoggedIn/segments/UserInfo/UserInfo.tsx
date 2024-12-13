import { useAirdropStore } from '@app/store/useAirdropStore';
import { Avatar, Info, Name, Wrapper } from './styles';

export default function UserInfo() {
    const { userDetails } = useAirdropStore();

    const profileimageurl = userDetails?.user?.profileimageurl;
    const name = userDetails?.user?.name;

    return (
        <Wrapper>
            <Avatar $image={profileimageurl} />
            {name ? (
                <Info>
                    <Name>@{name}</Name>
                </Info>
            ) : null}
        </Wrapper>
    );
}
