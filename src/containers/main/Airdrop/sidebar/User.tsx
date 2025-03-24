import { useAirdropStore } from '@app/store';
import { useAvatarGradient } from '@app/hooks/airdrop/utils/useAvatarGradient.ts';
import { SidebarItem } from './components/SidebarItem';
import { Avatar, TooltipAction } from './items.style';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { handleAirdropLogout } from '@app/store';

export default function User() {
    const { t } = useTranslation('airdrop');
    const userDetails = useAirdropStore((s) => s.userDetails);

    const profileimageurl = userDetails?.user?.profileimageurl;
    const name = userDetails?.user?.name;

    const style = useAvatarGradient({ username: name || '', image: profileimageurl });

    const tooltipContent = (
        <>
            <Typography variant="p">
                <Trans
                    i18nKey="logged-in-as"
                    ns="airdrop"
                    values={{ twitter: userDetails?.user.name }}
                    components={{ strong: <strong /> }}
                />
            </Typography>
            <TooltipAction>
                <button onClick={() => handleAirdropLogout(true)}>
                    <Typography variant="p">{t('disconnect')}</Typography>
                </button>
            </TooltipAction>
        </>
    );
    return (
        <SidebarItem tooltipContent={tooltipContent}>
            <Avatar style={style} />
        </SidebarItem>
    );
}
