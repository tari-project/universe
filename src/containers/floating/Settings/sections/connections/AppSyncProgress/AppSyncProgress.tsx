import { useEffect, useMemo, useState } from 'react';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { ProgressWrapper, Text, TextWrapper, Title, Wrapper } from './styles';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@app/store';
import { useSetupStore } from '@app/store/useSetupStore';

import { SetupPhase } from '@app/types/events-payloads';

export const AppSyncProgress = () => {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation('setup-progresses');

    const isInitialSetupFinished = useSetupStore((state) => state.isInitialSetupFinished);

    const corePhaseInfoPayload = useSetupStore((state) => state.core_phase_setup_payload);
    const hardwarePhaseInfoPayload = useSetupStore((state) => state.hardware_phase_setup_payload);
    const nodePhaseInfoPayload = useSetupStore((state) => state.node_phase_setup_payload);
    const miningPhaseInfoPayload = useSetupStore((state) => state.mining_phase_setup_payload);
    const walletPhaseInfoPayload = useSetupStore((state) => state.wallet_phase_setup_payload);

    const shouldShowModal = useUIStore((state) => state.showResumeAppModal);
    const disabledPhases = useSetupStore((state) => state.disabled_phases);

    const currentPhaseToShow = useMemo(() => {
        if (
            (walletPhaseInfoPayload?.is_complete || disabledPhases.includes(SetupPhase.Wallet)) &&
            Boolean(miningPhaseInfoPayload) &&
            !disabledPhases.includes(SetupPhase.Mining)
        ) {
            return miningPhaseInfoPayload;
        }

        if (
            hardwarePhaseInfoPayload?.is_complete &&
            Boolean(walletPhaseInfoPayload) &&
            !disabledPhases.includes(SetupPhase.Wallet)
        ) {
            return walletPhaseInfoPayload;
        }

        if (
            nodePhaseInfoPayload?.is_complete &&
            Boolean(hardwarePhaseInfoPayload) &&
            !disabledPhases.includes(SetupPhase.Hardware)
        ) {
            return hardwarePhaseInfoPayload;
        }

        if (
            corePhaseInfoPayload?.is_complete &&
            Boolean(nodePhaseInfoPayload) &&
            !disabledPhases.includes(SetupPhase.Node)
        ) {
            return nodePhaseInfoPayload;
        }

        return corePhaseInfoPayload;
    }, [
        corePhaseInfoPayload,
        disabledPhases,
        hardwarePhaseInfoPayload,
        miningPhaseInfoPayload,
        nodePhaseInfoPayload,
        walletPhaseInfoPayload,
    ]);

    const [stageProgress, stageTotal] = useMemo(() => {
        if (
            miningPhaseInfoPayload?.is_complete &&
            (walletPhaseInfoPayload?.is_complete || disabledPhases.includes(SetupPhase.Wallet))
        ) {
            return [5, 5];
        }

        if (walletPhaseInfoPayload?.is_complete) {
            return [4, 5];
        }

        if (hardwarePhaseInfoPayload?.is_complete) {
            return [3, 5];
        }

        if (nodePhaseInfoPayload?.is_complete) {
            return [2, 5];
        }

        if (corePhaseInfoPayload?.is_complete) {
            return [1, 5];
        }

        return [0, 5];
    }, [
        corePhaseInfoPayload?.is_complete,
        hardwarePhaseInfoPayload?.is_complete,
        miningPhaseInfoPayload?.is_complete,
        nodePhaseInfoPayload?.is_complete,
        walletPhaseInfoPayload?.is_complete,
        disabledPhases,
    ]);

    const setupPhaseTitle = currentPhaseToShow?.phase_title;
    const setupTitle = currentPhaseToShow?.title;
    const setupParams = currentPhaseToShow?.title_params ? { ...currentPhaseToShow.title_params } : {};

    useEffect(() => {
        const isOpen = shouldShowModal || (!currentPhaseToShow?.is_complete && !isInitialSetupFinished);
        setOpen(isOpen);
    }, [currentPhaseToShow?.is_complete, isInitialSetupFinished, shouldShowModal]);

    useEffect(() => {
        const hideResumeAppModal =
            miningPhaseInfoPayload?.is_complete &&
            (walletPhaseInfoPayload?.is_complete || disabledPhases.includes(SetupPhase.Wallet));

        if (hideResumeAppModal) {
            useUIStore.setState({ showResumeAppModal: false });
        }
    }, [miningPhaseInfoPayload?.is_complete, walletPhaseInfoPayload?.is_complete, disabledPhases]);

    return open && Boolean(currentPhaseToShow) ? (
        <Wrapper>
            <TextWrapper>
                <Title>{t(`phase-title.${setupPhaseTitle}`)}</Title>
                <Text>{t(`title.${setupTitle}`, { ...setupParams })}</Text>
            </TextWrapper>
            <ProgressWrapper>
                <Title>
                    {stageProgress} / {stageTotal}
                </Title>
                <CircularProgress />
            </ProgressWrapper>
        </Wrapper>
    ) : null;
};
