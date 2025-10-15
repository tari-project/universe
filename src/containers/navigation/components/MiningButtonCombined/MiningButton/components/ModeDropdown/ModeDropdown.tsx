import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import ArrowDown from './icons/ArrowDown';
import {
    Eyebrow,
    FloatingWrapper,
    IconWrapper,
    Menu,
    Option,
    OptionIcon,
    OptionText,
    SelectedValue,
    TextGroup,
    Trigger,
    Wrapper,
} from './styles';
import { AnimatePresence } from 'motion/react';
import SelectedIcon from './icons/SelectedIcon';

import {
    offset,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    FloatingFocusManager,
    useListNavigation,
    useTypeahead,
    useRole,
} from '@floating-ui/react';
import { useTranslation } from 'react-i18next';
import { useConfigMiningStore } from '@app/store';
import { setDialogToShow } from '@app/store/actions/uiStoreActions';
import { setCustomLevelsDialogOpen } from '@app/store/actions/miningStoreActions';
import { MiningModes, MiningModeType } from '@app/types/configs';
import { selectMiningMode } from '@app/store/actions/appConfigStoreActions';

import { getModeList } from './helpers.ts';
interface Props {
    disabled?: boolean;
    loading?: boolean;
    open?: boolean;
    variant?: 'primary' | 'secondary';
}

interface ModeDropdownMiningMode {
    sortingIndex?: string;
    name: string;
    mode_type: MiningModeType;
    icon: string;
}

export default function ModeDropdown({ disabled, loading, variant = 'primary', open = false }: Props) {
    const { t } = useTranslation('mining-view');
    const selectedMiningMode = useConfigMiningStore((s) => s.getSelectedMiningMode());
    const miningModes = useConfigMiningStore((s) => s.mining_modes);

    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const listRef = useRef<(HTMLElement | null)[]>([]);

    const { refs, floatingStyles, context } = useFloating({
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

    useEffect(() => setIsOpen(open), [open]);

    return (
        <Wrapper $isSecondary={variant === 'secondary'}>
            <Trigger
                ref={refs.setReference}
                {...getReferenceProps()}
                $isOpen={isOpen}
                $isSecondary={variant === 'secondary'}
                disabled={disabled || loading}
                aria-disabled={disabled || loading}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                tabIndex={disabled || loading ? -1 : 0}
            >
                <TextGroup>
                    <Eyebrow>{t('mode')}</Eyebrow>
                    <SelectedValue>
                        {selectedMiningMode?.mode_name}
                        <OptionIcon
                            src={modes.find((mode) => mode.mode_type === selectedMiningMode?.mode_type)?.icon}
                            alt=""
                            aria-hidden="true"
                            className="option-icon"
                        />
                    </SelectedValue>
                </TextGroup>
                <IconWrapper $isOpen={isOpen}>
                    <ArrowDown />
                </IconWrapper>
            </Trigger>
            <AnimatePresence>
                {isOpen && !disabled && !loading && (
                    <FloatingFocusManager context={context} modal={true} initialFocus={activeIndex || 0}>
                        <FloatingWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                            <Menu
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                role="listbox"
                            >
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
                                                    handleSelectMode(mode);
                                                }
                                            }}
                                            tabIndex={isActive ? 0 : -1}
                                            role="option"
                                            aria-selected={isSelected}
                                            $isSelected={isSelected}
                                            $isActive={isActive}
                                            {...getItemProps({
                                                onClick() {
                                                    handleSelectMode(mode);
                                                },
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
                            </Menu>
                        </FloatingWrapper>
                    </FloatingFocusManager>
                )}
            </AnimatePresence>
        </Wrapper>
    );
}
