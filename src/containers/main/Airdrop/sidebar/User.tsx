import { useAirdropStore } from '@app/store';
import { useAvatarGradient } from '@app/hooks/airdrop/utils/useAvatarGradient.ts';
import { SidebarItem } from './components/SidebarItem';
import { Avatar, TooltipWrapper } from './items.style';
import { Typography } from '@app/components/elements/Typography.tsx';

export default function User() {
    const userDetails = useAirdropStore((s) => s.userDetails);

    const profileimageurl = userDetails?.user?.profileimageurl;
    const name = userDetails?.user?.name;

    const style = useAvatarGradient({ username: name || '', image: profileimageurl });

    const tooltipContent = (
        <TooltipWrapper>
            <Typography variant="h6">{`@${name}`}</Typography>
        </TooltipWrapper>
    );
    return (
        <SidebarItem tooltipContent={tooltipContent}>
            <Avatar style={style} />
        </SidebarItem>
    );
}
