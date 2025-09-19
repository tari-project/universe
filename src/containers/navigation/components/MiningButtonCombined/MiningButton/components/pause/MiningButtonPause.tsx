import { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { offset, useClick, useDismiss, useFloating, useInteractions, useRole } from '@floating-ui/react';

import MiningButton from '../../MiningButton.tsx';
import PauseIcon from '../../../icons/PauseIcon.tsx';

import { IconWrapper, Options, OptionText, OptionWrapper, TimerAccent, TriggerWrapper } from './styles.ts';
import { Trans } from 'react-i18next';
import { TimerIcon } from './TimerIcon.tsx';
import { PauseOutlineIcon } from './PauseOutlineIcon.tsx';
import { stopMining } from '@app/store';

interface MiningButtonPauseProps {
    isMining: boolean;
    isMiningButtonDisabled?: boolean;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: -4 },
    show: { opacity: 1, y: 0 },
};

export default function MiningButtonPause({ isMining, isMiningButtonDisabled }: MiningButtonPauseProps) {
    const [showPauseOptions, setShowPauseOptions] = useState(false);
    const { refs, floatingStyles, context } = useFloating({
        open: showPauseOptions,
        onOpenChange: setShowPauseOptions,
        placement: 'bottom',
        middleware: [offset(34)],
    });
    const click = useClick(context);
    const dismiss = useDismiss(context);

    const role = useRole(context, { role: 'listbox' });
    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

    const handleStopMining = useCallback(async () => {
        await stopMining();
    }, []);

    const handlePause = useCallback(async (hours: number) => {
        console.info(`Pausing for ${hours} hours!`);
        await stopMining(); // TODO: add pause with duration logic
    }, []);

    function buttonClick() {
        setShowPauseOptions((c) => !c);
    }

    function renderDurationOption(hours: number) {
        return (
            <OptionWrapper variants={item} onClick={() => handlePause(hours)}>
                <IconWrapper>
                    <TimerIcon />
                    <TimerAccent>{hours}</TimerAccent>
                </IconWrapper>
                <OptionText>
                    <Trans
                        ns="mining-view"
                        i18nKey="pause.for-duration"
                        components={{ strong: <strong /> }}
                        values={{ duration: `${hours} hours` }}
                    />
                </OptionText>
            </OptionWrapper>
        );
    }

    return (
        <>
            <TriggerWrapper ref={refs.setReference} {...getReferenceProps()}>
                <MiningButton
                    buttonText="pause-mining"
                    onClick={buttonClick}
                    disabled={isMiningButtonDisabled}
                    icon={<PauseIcon />}
                    isMining={isMining}
                />
            </TriggerWrapper>
            <AnimatePresence>
                {showPauseOptions && (
                    <Options
                        ref={refs.setFloating}
                        variants={container}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        style={floatingStyles}
                        {...getFloatingProps()}
                    >
                        {renderDurationOption(2)}
                        {renderDurationOption(8)}
                        <OptionWrapper variants={item} onClick={handleStopMining}>
                            <IconWrapper>
                                <PauseOutlineIcon />
                            </IconWrapper>
                            <OptionText>
                                <Trans
                                    ns="mining-view"
                                    i18nKey="pause.until-restart"
                                    components={{ strong: <strong /> }}
                                />
                            </OptionText>
                        </OptionWrapper>
                    </Options>
                )}
            </AnimatePresence>
        </>
    );
}
