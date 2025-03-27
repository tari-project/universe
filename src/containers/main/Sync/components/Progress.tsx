import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import { useSetupStore } from '@app/store/useSetupStore.ts';
import { Typography } from '@app/components/elements/Typography.tsx';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 6px;
`;

const Percentage = styled(Typography).attrs({ variant: 'p' })`
    font-weight: 700;
`;

const Label = styled(Typography).attrs({ variant: 'p' })`
    font-weight: 400;
    color: ${({ theme }) => theme.palette.text.default};
`;
export default function Progress() {
    const { t } = useTranslation('setup-progresses');
    const corePhaseInfoPayload = useSetupStore((state) => state.core_phase_setup_payload);
    const setupPhaseTitle = corePhaseInfoPayload?.phase_title;
    const setupTitle = corePhaseInfoPayload?.title;
    const setupProgress = corePhaseInfoPayload?.progress;
    const setupParams = corePhaseInfoPayload?.title_params ? { ...corePhaseInfoPayload.title_params } : {};

    // const setUpText = setupTitle ? t(`setup-view:title.${setupTitle}`, setupTitleParams) : '';

    const setUpText =
        setupTitle && setupPhaseTitle
            ? `${t(`phase-title.${setupPhaseTitle}`)} | ${t(`title.${setupTitle}`, { ...setupParams })}`
            : '';
    return (
        <Wrapper>
            <LinearProgress variant="large" value={setupProgress} />
            <Percentage>{`${setupProgress}%`}</Percentage>
            <Label>{setUpText}</Label>
        </Wrapper>
    );
}
