import { useTranslation } from 'react-i18next';
import { SettingsGroup } from '@app/containers/floating/Settings/components/SettingsGroup.styles.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';
import { convertHexToRGBA, formatNumber, FormatPreset } from '@app/utils';
import { PoolStats as IPoolStats } from '@app/types/app-status.ts';
import styled from 'styled-components';

interface PoolStatsProps {
    poolStatus?: IPoolStats;
}

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    gap: 6px;
    flex-direction: column;
    border-top: 1px solid ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.03)};
    padding: 8px 0 0;
    h6 {
        color: ${({ theme }) => theme.palette.text.accent};
        font-size: 12px;
        font-weight: 600;
    }
`;
const ContentWrapper = styled.div`
    display: flex;
    flex-direction: row;
    strong {
        font-weight: 600;
        color: ${({ theme }) => theme.palette.text.secondary};
    }
`;

const ContentCol = styled.div`
    display: flex;
    flex-direction: column;
    flex-shrink: 1;
    width: 100%;
    gap: 4px;
`;

export function PoolStats({ poolStatus }: PoolStatsProps) {
    const { t } = useTranslation(['mining-view', 'settings'], { useSuspense: false });

    const unpaidFMT = formatNumber(poolStatus?.unpaid || 0, FormatPreset.XTM_LONG_DEC);
    const balanceFMT = formatNumber(poolStatus?.balance || 0, FormatPreset.XTM_LONG_DEC);

    return (
        <SettingsGroup>
            {poolStatus ? (
                <Wrapper>
                    <ContentWrapper>
                        <ContentCol>
                            <Typography>
                                {t('pool.accepted_shares')}: <strong>{poolStatus?.accepted_shares ?? `-`}</strong>
                            </Typography>
                        </ContentCol>
                        <ContentCol>
                            <Typography>
                                {t('pool.unpaid')}:{' '}
                                <strong>
                                    {unpaidFMT}
                                    {` XTM`}
                                </strong>
                            </Typography>
                        </ContentCol>
                        <ContentCol>
                            <Typography>
                                {t('pool.balance')}:{' '}
                                <strong>
                                    {balanceFMT}
                                    {` XTM`}
                                </strong>
                            </Typography>
                        </ContentCol>
                    </ContentWrapper>
                </Wrapper>
            ) : (
                <LoadingDots />
            )}
        </SettingsGroup>
    );
}
