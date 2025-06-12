import { memo, useEffect, useMemo, useState } from 'react';
import { CircularProgress } from '@app/components/elements/CircularProgress';
import { Text, Title, Wrapper, ProgressWrapper, TextWrapper } from './styles';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@app/store';
import { useSetupStore } from '@app/store/useSetupStore';
import { FloatingNode, FloatingPortal, useFloating, useFloatingNodeId } from '@floating-ui/react';
import { SetupPhase } from '@app/types/backend-state';

const ResumeApplicationModal = memo(function ResumeApplicationModal() {
    const [open, setOpen] = useState(false);
    const nodeId = useFloatingNodeId();
    const { t } = useTranslation('setup-progresses');
    const { refs } = useFloating({
        nodeId,
        open,
        onOpenChange: setOpen,
    });

    const status = useUIStore((s) => s.connectionStatus);
    const corePhaseInfoPayload = useSetupStore((state) => state.core_phase_setup_payload);
    const hardwarePhaseInfoPayload = useSetupStore((state) => state.hardware_phase_setup_payload);
    const nodePhaseInfoPayload = useSetupStore((state) => state.node_phase_setup_payload);
    const miningPhaseInfoPayload = useSetupStore((state) => state.mining_phase_setup_payload);
    const walletPhaseInfoPayload = useSetupStore((state) => state.wallet_phase_setup_payload);

    const isAppUnlocked = useSetupStore((state) => state.appUnlocked);
    const isSetupFinished = useSetupStore((state) => state.isInitialSetupFinished);
    const shouldShowModal = useUIStore((state) => state.showResumeAppModal);
    const disabledPhases = useSetupStore((state) => state.disabled_phases);

    const showModal = useMemo(() => {
        const shouldShowModalForInitialSetup = isAppUnlocked && !isSetupFinished;
        const shouldShowModalForResume = shouldShowModal && status === 'connected';
        return shouldShowModalForResume || shouldShowModalForInitialSetup;
    }, [isAppUnlocked, isSetupFinished, shouldShowModal, status]);

    console.log('ResumeApplicationModal render', {
        corePhaseInfoPayload,
        hardwarePhaseInfoPayload,
        nodePhaseInfoPayload,
        miningPhaseInfoPayload,
        walletPhaseInfoPayload,
        disabledPhases,
        showModal,
    });

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
        const isOpen = showModal && Boolean(currentPhaseToShow);
        setOpen(isOpen);
        useUIStore.setState({ resumeModalIsOpen: isOpen });
    }, [currentPhaseToShow, showModal]);

    useEffect(() => {
        if (
            miningPhaseInfoPayload?.is_complete &&
            (walletPhaseInfoPayload?.is_complete || disabledPhases.includes(SetupPhase.Wallet))
        ) {
            useUIStore.setState({ showResumeAppModal: false });
        }
    }, [miningPhaseInfoPayload?.is_complete, walletPhaseInfoPayload?.is_complete, disabledPhases]);

    return (
        <FloatingNode id={nodeId}>
            <FloatingPortal>
                {open && (
                    <Wrapper ref={refs.setFloating}>
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
                )}
            </FloatingPortal>
        </FloatingNode>
    );
});

export default ResumeApplicationModal;
