import { ToggleSwitch } from '@app/components/elements/ToggleSwitch';
import { Typography } from '@app/components/elements/Typography';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    height: 45px;
    padding: 11px 11px 11px 20px;
    justify-content: center;
    align-items: center;
    border-radius: 60px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.35);
    gap: 15px;
    color: #000;
`;

export default function Permissions() {
    const { t } = useTranslation('airdrop');
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);
    const config_creation = useAppConfigStore((s) => s.config_creation);
    const now = new Date();
    const config_creation_date = config_creation?.secs_since_epoch
        ? new Date(config_creation?.secs_since_epoch * 1000)
        : null;

    const diff = config_creation_date ? now.getTime() - config_creation_date.getTime() : 0;
    const isFirstLoad = diff > 0 && diff < 1000 * 60; // 1 min buffer

    const handleChange = useCallback(async () => {
        await setAllowTelemetry(!allowTelemetry);
    }, [allowTelemetry, setAllowTelemetry]);

    return isFirstLoad ? (
        <Wrapper>
            <Typography variant="p">
                <Trans>{t('permission.setup')}</Trans>
            </Typography>
            <ToggleSwitch checked={allowTelemetry} onChange={handleChange} />
        </Wrapper>
    ) : null;
}
