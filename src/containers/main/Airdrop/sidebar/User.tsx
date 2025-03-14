import { useAirdropStore } from '@app/store';
import { useAvatarGradient } from '@app/hooks/airdrop/utils/useAvatarGradient.ts';
import { SidebarItem } from './components/SidebarItem';
import { Avatar } from './items.style';

export default function User() {
    const userDetails = useAirdropStore((s) => s.userDetails);

    const profileimageurl = userDetails?.user?.profileimageurl;
    const name = userDetails?.user?.name;

    const style = useAvatarGradient({ username: name || '', image: profileimageurl });

    return (
        <SidebarItem>
            <Avatar style={style} />
        </SidebarItem>
    );
}
