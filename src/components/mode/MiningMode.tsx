import { useCallback, useEffect, useMemo, useRef, useState, KeyboardEvent } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
    FloatingFocusManager,
    FloatingNode,
    FloatingPortal,
    offset,
    useClick,
    useDismiss,
    useFloating,
    useFloatingNodeId,
    useFloatingParentNodeId,
    useInteractions,
    useListNavigation,
    useRole,
    useTypeahead,
} from '@floating-ui/react';

import { MiningModes, MiningModeType } from '@app/types/configs.ts';
import { setCustomLevelsDialogOpen, setDialogToShow, useConfigMiningStore } from '@app/store';
import { ModeDropdownMiningMode } from '@app/components/mode/types.ts';
import { selectMiningMode } from '@app/store/actions/appConfigStoreActions.ts';

import SelectedIcon from '@app/assets/icons/SelectedIcon.tsx';

import { getModeList } from './helpers.ts';
import { List } from './dropdown/List.tsx';
import { Trigger } from './trigger/Trigger.tsx';
import { ListContainer, Option, OptionIcon, OptionText } from './styles.ts';

interface MiningModeProps {
    open?: boolean;
}

export const MiningMode = ({ open = false }: MiningModeProps) => {
    const { t } = useTranslation('mining-view');
    const selectedMiningMode = useConfigMiningStore((s) => s.getSelectedMiningMode());
    const miningModes = useConfigMiningStore((s) => s.mining_modes);

    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const listRef = useRef<(HTMLElement | null)[]>([]);

    const parentId = useFloatingParentNodeId();
    const nodeId = useFloatingNodeId(parentId || undefined);

    const { refs, floatingStyles, context } = useFloating({
        nodeId,
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-end',
        middleware: [offset(8)],
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

    useEffect(() => {
        if (isOpen) {
            const selectedIndex = modes.findIndex((mode) => mode.name === selectedMiningMode?.mode_name);
            const initialIndex = selectedIndex >= 0 ? selectedIndex : 0;
            setActiveIndex(initialIndex);
        } else {
            setActiveIndex(null);
        }
    }, [isOpen, selectedMiningMode, modes]);

    const handleSelectMode = useCallback(
        async (mode: ModeDropdownMiningMode) => {
            if (mode.mode_type === MiningModeType.Custom) {
                setCustomLevelsDialogOpen(true);
                setIsOpen(false);
                return;
            }
            if (mode.mode_type === MiningModeType.Ludicrous) {
                setDialogToShow('ludicrousConfirmation');
                setIsOpen(false);
                return;
            }
            if (mode.mode_type === selectedMiningMode?.mode_type) {
                setIsOpen(false);
                return;
            }
            await selectMiningMode(mode.name);
            setIsOpen(false);
        },
        [selectedMiningMode]
    );

    const handleKeyDown = useCallback(async (e: KeyboardEvent<HTMLButtonElement>, mode: ModeDropdownMiningMode) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            await handleSelectMode(mode);
        }
    }, []);

    useEffect(() => setIsOpen(open), [open]);

    return (
        <FloatingNode id={nodeId}>
            <Trigger
                ref={refs.setReference}
                {...getReferenceProps()}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                label={t('mode')}
            >
                {selectedMiningMode?.mode_name}
                <OptionIcon
                    src={modes.find((mode) => mode.mode_type === selectedMiningMode?.mode_type)?.icon}
                    alt=""
                    aria-hidden="true"
                    className="option-icon"
                />
            </Trigger>
            <AnimatePresence>
                {isOpen && (
                    <FloatingFocusManager context={context} modal={true} initialFocus={activeIndex || 0}>
                        <FloatingPortal>
                            <ListContainer ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
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
                                                onKeyDown={(e) => handleKeyDown(e, mode)}
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
                            </ListContainer>
                        </FloatingPortal>
                    </FloatingFocusManager>
                )}
            </AnimatePresence>
        </FloatingNode>
    );
};
