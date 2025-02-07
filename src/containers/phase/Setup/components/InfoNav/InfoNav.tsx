import InfoItemGraphic from '@app/containers/phase/Setup/components/InfoNav/InfoItemGraphic';
import { AnimatePresence } from 'motion/react';
import { memo, useCallback, useState } from 'react';
import InfoItem from './InfoItem';
import { Nav, NavContainer, NavItem, NavItemCurrent } from './InfoNav.styles';
import { useTranslation } from 'react-i18next';

const steps = Array.from({ length: 6 }, (_, i) => i + 1);

const emojis = {
    'step-1': ['💜', '🐢'],
    'step-6': ['🙏'],
};

const calculateReadingTime = (text: string) => {
    const words = text.split(' ').length;
    return (words / 350) * 60 + 3; // Convert to seconds + 3s for a pause
};

const InfoNav = memo(function InfoNav() {
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

    const stepEmojis = emojis[`step-${currentStep}`];

    const emojiParams = {};
    if (stepEmojis?.length) {
        stepEmojis.forEach((e: string, i: number) => (emojiParams[`emoji${i > 0 ? i : ''}`] = e));
    }

    const title = t(`heading.step-${currentStep}`);
    const text = t(`content.step-${currentStep}`, { ...emojiParams });

    const sliderMarkup = steps?.map((step) => {
        const key = `nav-item-${step}`;
        const isSelected = currentStep === step;
        const duration = calculateReadingTime(title + text);

        return (
            <NavItem key={key} onClick={() => handleStepClick(step)}>
                {isSelected ? (
                    <NavItemCurrent key={`selected:${key}`} $duration={duration} onAnimationEnd={handleNextStep} />
                ) : null}
            </NavItem>
        );
    });

    return (
        <NavContainer>
            <AnimatePresence mode="wait">
                <InfoItem key={`step-${currentStep}-content-wrapper`} title={title} text={text} step={currentStep} />
            </AnimatePresence>
            <AnimatePresence>
                <InfoItemGraphic key={`step-${currentStep}-graphics-wrapper`} step={currentStep} />
            </AnimatePresence>
            <Nav>{sliderMarkup}</Nav>
        </NavContainer>
    );
});
export default InfoNav;
