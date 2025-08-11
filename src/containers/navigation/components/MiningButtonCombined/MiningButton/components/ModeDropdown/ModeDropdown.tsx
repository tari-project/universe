'use client';
import { useCallback, useMemo, useState } from 'react';
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
import ecoIcon from './images/eco.png';
import ludicIcon from './images/ludicrous.png';
import customIcon from '@app/assets/icons/emoji/custom.png';
import { offset, useClick, useDismiss, useFloating, useInteractions, FloatingFocusManager } from '@floating-ui/react';
import { useTranslation } from 'react-i18next';
import { useConfigMiningStore } from '@app/store';
import { setDialogToShow } from '@app/store/actions/uiStoreActions';
import { setCustomLevelsDialogOpen } from '@app/store/actions/miningStoreActions';
import { MiningModeType } from '@app/types/configs';
import { selectMiningMode } from '@app/store/actions/appConfigStoreActions';

interface Props {
    disabled?: boolean;
    loading?: boolean;
}

interface ModeDropdownMiningMode {
    name: string;
    mode_type: MiningModeType;
    icon: string;
}

const getModeIcon = (mode: MiningModeType) => {
    switch (mode) {
        case MiningModeType.Eco:
            return ecoIcon;
        case MiningModeType.Ludicrous:
            return ludicIcon;
        case MiningModeType.Custom:
            return customIcon;
        case MiningModeType.User:
            return customIcon;
        default:
            return customIcon;
    }
};

export default function ModeDropdown({ disabled, loading }: Props) {
    const { t } = useTranslation('mining-view');
    const selectedMiningMode = useConfigMiningStore((s) => s.getSelectedMiningMode());
    const miningModes = useConfigMiningStore((s) => s.mining_modes);
    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-end',
        middleware: [offset(8)],
    });
    const click = useClick(context);
    const dismiss = useDismiss(context);
    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

    const modes: ModeDropdownMiningMode[] = useMemo(() => {
        return Object.values(miningModes)
            .map((mode) => {
                return {
                    name: mode.mode_name,
                    mode_type: mode.mode_type,
                    icon: getModeIcon(mode.mode_type),
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [miningModes]);

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

    return (
        <Wrapper>
            <Trigger
                ref={refs.setReference}
                {...getReferenceProps()}
                $isOpen={isOpen}
                disabled={disabled || loading}
                aria-disabled={disabled || loading}
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
                    <FloatingFocusManager context={context} modal={true}>
                        <FloatingWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                            <Menu
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                            >
                                {modes.map((mode) => (
                                    <Option
                                        key={mode.name}
                                        onClick={() => handleSelectMode(mode)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleSelectMode(mode);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="option"
                                        aria-selected={mode.name === selectedMiningMode?.mode_name}
                                        $isSelected={mode.name === selectedMiningMode?.mode_name}
                                    >
                                        <OptionIcon src={mode.icon} alt="" aria-hidden="true" className="option-icon" />
                                        <OptionText>{mode.name}</OptionText>
                                        {mode.name === selectedMiningMode?.mode_name && (
                                            <SelectedIcon className="selected-icon" />
                                        )}
                                    </Option>
                                ))}
                            </Menu>
                        </FloatingWrapper>
                    </FloatingFocusManager>
                )}
            </AnimatePresence>
        </Wrapper>
    );
}
