import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import MiningButtonCombined from '@app/containers/navigation/components/MiningButtonCombined/MiningButtonCombined.tsx';
import MiningTiles from '@app/containers/navigation/components/MiningTiles/MiningTiles.tsx';
import { PoolsSettings } from '@app/containers/floating/Settings/sections/pools/PoolsSettings.tsx';
import { Typography } from '@app/components/elements/Typography';
import { SidebarContent, SidebarWrapper } from './Sidebar.styles.ts';

const variants = {
    hidden: { opacity: 0, left: -10 },
    visible: { opacity: 1, left: 0 },
};

const PageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    height: 100%;
`;

const SectionTitle = styled.div`
    padding: 0 4px;
`;

export default function SidebarMining() {
    const { t } = useTranslation('sidebar');
    return (
        <SidebarWrapper
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            data-testid="sidebar-mining-page"
        >
            <SidebarContent>
                <PageWrapper>
                    <SectionTitle>
                        <Typography variant="h5">{t('mining-page.title')}</Typography>
                    </SectionTitle>
                    <MiningButtonCombined />
                    <MiningTiles />
                    <SectionTitle>
                        <Typography variant="h6">{t('mining-page.pool-settings')}</Typography>
                    </SectionTitle>
                    <PoolsSettings />
                </PageWrapper>
            </SidebarContent>
        </SidebarWrapper>
    );
}
