import { LinearProgress } from '@app/components/elements/LinearProgress';
import InfoItemGraphic from '@app/containers/phase/Setup/components/InfoNav/InfoItemGraphic';
import { AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';
import InfoItem from './InfoItem';
import { Nav, NavContainer, NavItem, NavItemCurrent } from './InfoNav.styles';

const STEP_TIME_SECONDS = 9;
const steps = Array.from({ length: 6 }, (_, i) => i + 1);

export default function InfoNav() {
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
                            duration={STEP_TIME_SECONDS}
                            variant="tiny"
                            onAnimationComplete={handleNextStep}
                        />
                    </NavItemCurrent>
                ) : null}
            </NavItem>
        );
    });

    return (
        <NavContainer>
            <AnimatePresence mode="wait">
                <InfoItem key={`step-${currentStep}-content-wrapper`} step={currentStep} />
            </AnimatePresence>
            <AnimatePresence>
                <InfoItemGraphic key={`step-${currentStep}-graphics-wrapper`} step={currentStep} />
            </AnimatePresence>
            <Nav>{sliderMarkup}</Nav>
        </NavContainer>
    );
}
