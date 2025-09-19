import { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { offset, useClick, useDismiss, useFloating, useInteractions, useRole } from '@floating-ui/react';

import MiningButton from '../../MiningButton.tsx';
import PauseIcon from '../../../icons/PauseIcon.tsx';

import { IconWrapper, Options, OptionText, OptionWrapper, TriggerWrapper } from './styles.ts';
import { Trans, useTranslation } from 'react-i18next';
import { TimerIcon } from './TimerIcon.tsx';
import { PauseOutlineIcon } from './PauseOutlineIcon.tsx';

interface MiningButtonPauseProps {
    isMining: boolean;
    isMiningButtonDisabled?: boolean;
}

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
        setShowPauseOptions((c) => !c);
        // await stopMining();
    }, []);

    return (
        <>
            <TriggerWrapper ref={refs.setReference} {...getReferenceProps()}>
                <MiningButton
                    buttonText="pause-mining"
                    onClick={handleStopMining}
                    disabled={isMiningButtonDisabled}
                    icon={<PauseIcon />}
                    isMining={isMining}
                />
            </TriggerWrapper>
            <AnimatePresence>
                {showPauseOptions && (
                    <Options ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <OptionWrapper>
                            <IconWrapper>
                                <TimerIcon />
                            </IconWrapper>
                            <OptionText>
                                <Trans
                                    ns="mining-view"
                                    i18nKey="pause.for-duration"
                                    components={{ strong: <strong /> }}
                                    values={{ duration: `2 hours` }}
                                />
                            </OptionText>
                        </OptionWrapper>
                        <OptionWrapper>
                            <IconWrapper>
                                <TimerIcon />
                            </IconWrapper>
                            <OptionText>
                                <Trans
                                    ns="mining-view"
                                    i18nKey="pause.for-duration"
                                    components={{ strong: <strong /> }}
                                    values={{ duration: `8 hours` }}
                                />
                            </OptionText>
                        </OptionWrapper>
                        <OptionWrapper>
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
