import { useAirdropStore } from '@app/store';
import { SidebarItem } from './components/SidebarItem';
import { TooltipAction } from './items.style';
import { Typography } from '@app/components/elements/Typography.tsx';
import { Trans, useTranslation } from 'react-i18next';
import { handleAirdropLogout } from '@app/store';
import Avatar from '@app/components/elements/Avatar/Avatar';
import { useEffect, useState } from 'react';

export default function User() {
    const { t } = useTranslation('airdrop');
    const userDetails = useAirdropStore((s) => s.userDetails);

    const [img, setImg] = useState<string | undefined>();

    const profileimageurl = userDetails?.user?.image_url;

    useEffect(() => {
        if (img?.length || !profileimageurl) return;
        async function testImage(url: string) {
            fetch(url)
                .then((r) => {
                    if (r.ok) {
                        setImg(url);
                    } else {
                        setImg(undefined);
                    }
                })
                .catch((_) => {
                    setImg(undefined);
                });
        }

        void testImage(profileimageurl);
    }, [img?.length, profileimageurl]);

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
            <Avatar image={img} username={name} size={38} />
        </SidebarItem>
    );
}
