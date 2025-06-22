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
import customIcon from './images/custom.png';
import { offset, useClick, useDismiss, useFloating, useInteractions } from '@floating-ui/react';

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

export default function ModeDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMode, setSelectedMode] = useState(modes[0]);

    const handleSelectMode = (mode: (typeof modes)[number]) => {
        setSelectedMode(mode);
        setIsOpen(false);
    };

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'bottom-end',
        middleware: [offset(8)],
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);

    const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

    return (
        <Wrapper>
            <Trigger ref={refs.setReference} {...getReferenceProps()} $isOpen={isOpen}>
                <TextGroup>
                    <Eyebrow>{`Mode`}</Eyebrow>
                    <SelectedValue>
                        <OptionIcon src={selectedMode.icon} alt={selectedMode.name} />
                        {selectedMode.name}
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                        >
                            {modes.map((mode) => (
                                <Option key={mode.name} onClick={() => handleSelectMode(mode)}>
                                    <OptionIcon src={mode.icon} alt={mode.name} />
                                    <OptionText>{mode.name}</OptionText>
                                    {mode.name === selectedMode.name && <SelectedIcon className="selected-icon" />}
                                </Option>
                            ))}
                        </Menu>
                    </FloatingWrapper>
                )}
            </AnimatePresence>
        </Wrapper>
    );
}
