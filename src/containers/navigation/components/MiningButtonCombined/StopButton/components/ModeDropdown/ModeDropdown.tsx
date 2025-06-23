import { useState } from 'react';
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

const modes = [
    {
        name: 'Eco',
        icon: ecoIcon,
    },
    {
        name: 'Ludicrous',
        icon: ludicIcon,
    },
    {
        name: 'Custom',
        icon: customIcon,
    },
];

interface Props {
    selectedMode: string;
    setSelectedMode: (mode: string) => void;
}

export default function ModeDropdown({ selectedMode, setSelectedMode }: Props) {
    const { t } = useTranslation('mining-view');

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

    const handleSelectMode = (mode: string) => {
        setSelectedMode(mode);
        setIsOpen(false);
    };

    return (
        <Wrapper>
            <Trigger ref={refs.setReference} {...getReferenceProps()} $isOpen={isOpen}>
                <TextGroup>
                    <Eyebrow>{t(`mode`)}</Eyebrow>
                    <SelectedValue>
                        {selectedMode}
                        <OptionIcon
                            src={modes.find((mode) => mode.name === selectedMode)?.icon}
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
                {isOpen && (
                    <FloatingWrapper ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                        <Menu
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                        >
                            {modes.map((mode) => (
                                <Option
                                    key={mode.name}
                                    onClick={() => handleSelectMode(mode.name)}
                                    $isSelected={mode.name === selectedMode}
                                >
                                    <OptionIcon src={mode.icon} alt="" aria-hidden="true" className="option-icon" />
                                    <OptionText>{mode.name}</OptionText>
                                    {mode.name === selectedMode && <SelectedIcon className="selected-icon" />}
                                </Option>
                            ))}
                        </Menu>
                    </FloatingWrapper>
                )}
            </AnimatePresence>
        </Wrapper>
    );
}
