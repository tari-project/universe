import { LinearProgress } from '@app/components/elements/LinearProgress';
import InfoItemGraphic from '@app/containers/phase/Setup/components/InfoNav/InfoItemGraphic';
import { AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';
import InfoItem from './InfoItem';
import { Nav, NavContainer, NavItem, NavItemCurrent } from './InfoNav.styles';
import { useTranslation } from 'react-i18next';

const steps = Array.from({ length: 6 }, (_, i) => i + 1);

const emojis = {
    'step-1': ['💜', '🐢'],
    'step-6': ['🙏'],
};

const slideTime = {
    'step-1': 6,
    'step-2': 8,
    'step-3': 7,
    'step-4': 6,
    'step-5': 9,
    'step-6': 6,
};

export default function InfoNav() {
    const { t } = useTranslation('info');
    const [currentStep, setCurrentStep] = useState(steps[0]);

    const handleStepClick = useCallback((newStep: number) => {
        setCurrentStep(newStep);
    }, []);

    const handleNextStep = () => {
        setCurrentStep((c) => {
            if (c < steps.length) {
                return c + 1;
            } else {
                return 1;
            }
        });
    };

    const sliderMarkup = steps?.map((step) => {
        const key = `nav-item-${step}`;
        const isSelected = currentStep === step;

        return (
            <NavItem key={key} $selected={isSelected} onClick={() => handleStepClick(step)}>
                <LinearProgress value={0} variant="tiny" />
                {isSelected ? (
                    <NavItemCurrent layoutId="selected" key={`selected:${key}`}>
                        <LinearProgress
                            value={100}
                            duration={slideTime[`step-${currentStep}`]}
                            variant="tiny"
                            onAnimationComplete={handleNextStep}
                        />
                    </NavItemCurrent>
                ) : null}
            </NavItem>
        );
    });

    const stepEmojis = emojis[`step-${currentStep}`];

    const emojiParams = {};
    if (stepEmojis?.length) {
        stepEmojis.forEach((e: string, i: number) => (emojiParams[`emoji${i > 0 ? i : ''}`] = e));
    }

    const title = t(`heading.step-${currentStep}`);
    const text = t(`content.step-${currentStep}`, { ...emojiParams });

    return (
        <NavContainer>
            <AnimatePresence mode="wait">
                <InfoItem key={`step-${currentStep}-content-wrapper`} title={title} text={text} />
            </AnimatePresence>
            <AnimatePresence>
                <InfoItemGraphic key={`step-${currentStep}-graphics-wrapper`} step={currentStep} />
            </AnimatePresence>
            <Nav>{sliderMarkup}</Nav>
        </NavContainer>
    );
}
