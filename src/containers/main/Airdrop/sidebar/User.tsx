import { useAirdropStore } from '@app/store';
import { SidebarItem } from './components/SidebarItem';
import { TooltipAction } from './items.style';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { handleAirdropLogout } from '@app/store';
import Avatar from '@app/components/elements/Avatar/Avatar';

export default function User() {
    const { t } = useTranslation('airdrop');
    const userDetails = useAirdropStore((s) => s.userDetails);

    const profileimageurl = userDetails?.user?.image_url;
    const name = userDetails?.user?.name;

    const tooltipContent = (
        <>
            <Typography variant="p">
                <Trans
                    i18nKey="logged-in-as"
                    ns="airdrop"
                    values={{ twitter: name }}
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
            <Avatar image={profileimageurl} username={name} size={38} />
        </SidebarItem>
    );
}
