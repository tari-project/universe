import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
    autoUpdate,
    FloatingFocusManager,
    offset,
    size,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useListNavigation,
    useRole,
    useTypeahead,
} from '@floating-ui/react';

import { MiningMode as MiningModeDataType, MiningModes, MiningModeType } from '@app/types/configs.ts';
import { setCustomLevelsDialogOpen, setDialogToShow, useConfigMiningStore } from '@app/store';
import { ModeDropdownMiningMode, Variant } from '@app/components/mode/types.ts';
import { selectMiningMode } from '@app/store/actions/appConfigStoreActions.ts';

import SelectedIcon from '@app/assets/icons/SelectedIcon.tsx';

import { getModeList } from './helpers.ts';
import { List } from './dropdown/List.tsx';
import { Trigger } from './trigger/Trigger.tsx';
import { ListContainer, Option, OptionIcon, OptionText, Wrapper } from './styles.ts';

interface MiningModeProps {
    variant?: Variant;
    open?: boolean;
    handleSchedulerMiningModeCallback?: (modeName: string) => void;
    schedulerSelectedMiningMode?: MiningModeDataType | undefined;
}

export const MiningMode = ({
    variant = 'primary',
    open = false,
    handleSchedulerMiningModeCallback,
    schedulerSelectedMiningMode,
}: MiningModeProps) => {
    const { t } = useTranslation('mining-view');
    const storeSelectedMiningMode = useConfigMiningStore((s) => s.getSelectedMiningMode());
    const selectedMiningMode = useMemo(
        () => schedulerSelectedMiningMode || storeSelectedMiningMode,
        [schedulerSelectedMiningMode, storeSelectedMiningMode]
    );
    const miningModes = useConfigMiningStore((s) => s.mining_modes);

    const [isOpen, setIsOpen] = useState(open);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const listRef = useRef<(HTMLElement | null)[]>([]);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        setIsOpen(newOpen);
        if (!newOpen) {
            listRef.current = [];
        }
    }, []);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: handleOpenChange,
        placement: 'bottom-end',
        whileElementsMounted: autoUpdate,
        middleware: [
            offset({ mainAxis: variant === 'primary' ? 10 : 5 }),
            size({
                apply({ elements, availableHeight }) {
                    const refWidth = elements.reference.getBoundingClientRect().width;
                    Object.assign(elements.floating.style, {
                        maxHeight: `${availableHeight}px`,
                        maxWidth: `${refWidth}px`,
                    });
                },
                padding: {
                    bottom: 10,
                },
            }),
        ],
    });

    const modes: ModeDropdownMiningMode[] = useMemo(
        () => (miningModes ? getModeList(miningModes as MiningModes) : []),
        [miningModes]
    );

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'listbox' });

    const listNavigation = useListNavigation(context, {
        listRef,
        activeIndex,
        onNavigate: setActiveIndex,
        loop: true,
    });

    const typeahead = useTypeahead(context, {
        listRef: {
            current: modes.map((mode) => mode.name),
        },
        activeIndex,
        onMatch: setActiveIndex,
        onTypingChange(isTyping) {
            if (isTyping) {
                setActiveIndex(null);
            }
        },
        resetMs: 1000,
    });

    const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
        click,
        dismiss,
        role,
        listNavigation,
        typeahead,
    ]);

    const handleSelectMode = useCallback(
        async (mode: ModeDropdownMiningMode) => {
            if (handleSchedulerMiningModeCallback) {
                // Call on the top to ensure next called selectMiningMode changes the scheduler value
                handleSchedulerMiningModeCallback(mode.name);
            }

            if (mode.mode_type === MiningModeType.Custom) {
                setCustomLevelsDialogOpen(true);
                handleOpenChange(false);
                return;
            }
            if (mode.mode_type === MiningModeType.Ludicrous) {
                setDialogToShow('ludicrousConfirmation');
                handleOpenChange(false);
                return;
            }
            if (mode.mode_type === selectedMiningMode?.mode_type) {
                handleOpenChange(false);
                return;
            }

            await selectMiningMode(mode.name);
            handleOpenChange(false);
        },
        [handleOpenChange, handleSchedulerMiningModeCallback, selectedMiningMode?.mode_type]
    );

    return (
        <Wrapper>
            <Trigger
                ref={refs.setReference}
                {...getReferenceProps()}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                label={t('modes.mode', { context: variant === 'secondary' && 'long' })}
                variant={variant}
                isOpen={isOpen}
                selectedMode={selectedMiningMode?.mode_type || ('Eco' as MiningModeType)}
            >
                {selectedMiningMode?.mode_name}
                <OptionIcon
                    src={modes.find((mode) => mode.mode_type === selectedMiningMode?.mode_type)?.icon}
                    alt=""
                    aria-hidden="true"
                    className="option-icon"
                />
            </Trigger>

            {isOpen ? (
                <FloatingFocusManager context={context} modal={true} initialFocus={activeIndex || 0}>
                    <ListContainer ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <AnimatePresence>
                            <List>
                                {modes.map((mode, index) => {
                                    const isSelected = mode.name === selectedMiningMode?.mode_name;
                                    const isActive = activeIndex === index;
                                    return (
                                        <Option
                                            key={mode.name}
                                            ref={(node) => {
                                                listRef.current[index] = node;
                                            }}
                                            onClick={() => handleSelectMode(mode)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    void handleSelectMode(mode);
                                                }
                                            }}
                                            tabIndex={isActive ? 0 : -1}
                                            role="option"
                                            aria-selected={isSelected}
                                            $isSelected={isSelected}
                                            $isActive={isActive}
                                            {...getItemProps({
                                                onClick: () => handleSelectMode(mode),
                                            })}
                                        >
                                            <OptionIcon
                                                src={mode.icon}
                                                alt=""
                                                aria-hidden="true"
                                                className="option-icon"
                                            />
                                            <OptionText>{mode.name}</OptionText>
                                            {isSelected && <SelectedIcon className="selected-icon" />}
                                        </Option>
                                    );
                                })}
                            </List>
                        </AnimatePresence>
                    </ListContainer>
                </FloatingFocusManager>
            ) : null}
        </Wrapper>
    );
};
