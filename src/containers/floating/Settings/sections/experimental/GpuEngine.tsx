import { Typography } from '@app/components/elements/Typography.tsx';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useMiningStore } from '@app/store/useMiningStore';
import { Select } from '@app/components/elements/inputs/Select';
import { useCallback, useMemo } from 'react';
import { SettingsGroupContent, SettingsGroupTitle, SettingsGroupWrapper } from '../../components/SettingsGroup.styles';
import { m } from 'framer-motion';

const Wrapper = styled(m.div)`
    width: 100%;
    display: flex;
    position: relative;
`;

export default function GpuEngine() {
    const { t } = useTranslation(['common', 'settings'], { useSuspense: false });
    const availableEngines = useMiningStore((state) => state.availableEngines);
    const selectedEngine = useMiningStore((state) => state.engine);
    const setEngine = useMiningStore((state) => state.setEngine);

    const engineOptions = useMemo(() => {
        return availableEngines.map((engine) => ({
            label: engine,
            value: engine,
        }));
    }, [availableEngines]);

    const handleEngineChange = useCallback(
        async (value: string) => {
            await setEngine(value);
        },
        [setEngine]
    );

    return (
        <SettingsGroupWrapper>
            <SettingsGroupTitle>
                <Typography variant="h6">{t('change-gpu-engine', { ns: 'settings' })}</Typography>
            </SettingsGroupTitle>
            {availableEngines.length > 0 ? (
                <SettingsGroupContent>
                    <Wrapper>
                        <Select
                            options={engineOptions}
                            onChange={handleEngineChange}
                            selectedValue={selectedEngine}
                            variant="bordered"
                            forceHeight={36}
                        />
                    </Wrapper>
                </SettingsGroupContent>
            ) : (
                <Typography variant="p">{t('gpu-device-no-found', { ns: 'settings' })}</Typography>
            )}
        </SettingsGroupWrapper>
    );
}
