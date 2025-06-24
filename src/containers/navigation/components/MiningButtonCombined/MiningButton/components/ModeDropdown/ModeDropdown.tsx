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
import { offset, useClick, useDismiss, useFloating, useInteractions } from '@floating-ui/react';
import { useTranslation } from 'react-i18next';
import { useConfigMiningStore, useConfigUIStore } from '@app/store';
import { setDialogToShow } from '@app/store/actions/uiStoreActions';
import { changeMiningMode, setCustomLevelsDialogOpen } from '@app/store/actions/miningStoreActions';
import { modeType } from '@app/store/types';

interface Props {
    disabled?: boolean;
    loading?: boolean;
}

export default function ModeDropdown({ disabled, loading }: Props) {
    const { t } = useTranslation('mining-view');
    const mode = useConfigMiningStore((s) => s.mode);
    const custom_power_levels_enabled = useConfigUIStore((s) => s.custom_power_levels_enabled);
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

    const modes = useMemo(() => {
        const arr = [
            { name: 'Eco', icon: ecoIcon },
            { name: 'Ludicrous', icon: ludicIcon },
        ];
        if (custom_power_levels_enabled) arr.push({ name: 'Custom', icon: customIcon });
        return arr;
    }, [custom_power_levels_enabled]);

    const handleSelectMode = useCallback(
        async (selected: string) => {
            if (selected === mode) {
                setIsOpen(false);
                return;
            }
            if (selected === 'Custom') {
                setCustomLevelsDialogOpen(true);
                setIsOpen(false);
                return;
            }
            if (selected === 'Ludicrous') {
                setDialogToShow('ludicrousConfirmation');
                setIsOpen(false);
                return;
            }
            await changeMiningMode({ mode: selected as modeType });
            setIsOpen(false);
        },
        [mode]
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
                        {mode}
                        <OptionIcon
                            src={modes.find((m) => m.name === mode)?.icon}
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
                    <FloatingWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <Menu
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                        >
                            {modes.map((m) => (
                                <Option
                                    key={m.name}
                                    onClick={() => handleSelectMode(m.name)}
                                    $isSelected={m.name === mode}
                                >
                                    <OptionIcon src={m.icon} alt="" aria-hidden="true" className="option-icon" />
                                    <OptionText>{m.name}</OptionText>
                                    {m.name === mode && <SelectedIcon className="selected-icon" />}
                                </Option>
                            ))}
                        </Menu>
                    </FloatingWrapper>
                )}
            </AnimatePresence>
        </Wrapper>
    );
}
