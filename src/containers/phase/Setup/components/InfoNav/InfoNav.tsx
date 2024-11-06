import { LinearProgress } from '@app/components/elements/LinearProgress';
import InfoItemGraphic from '@app/containers/phase/Setup/components/InfoNav/InfoItemGraphic';
import { useAppStateStore } from '@app/store/appStateStore';
import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import InfoItem from './InfoItem';
import { Nav, NavContainer, NavItem, NavItemCurrent } from './InfoNav.styles';

const STEP_TIME = 1000 * 15;
const steps = Array.from({ length: 6 }, (_, i) => i + 1);

export default function InfoNav() {
    const setupProgress = useAppStateStore((s) => s.setupProgress);
    const progressPercentage = Math.floor(setupProgress * 100);

    const [currentStep, setCurrentStep] = useState(steps[0]);
    const [stepPercentage, setStepPercentage] = useState(0);

    const interval = useRef(0);

    const handleStepClick = useCallback((newStep: number) => {
        interval.current = 0;
        setCurrentStep(newStep);
        setStepPercentage(0);
    }, []);

    useEffect(() => {
        const percentageInterval = setInterval(() => {
            if (interval.current < 15) {
                interval.current += 1;
            }
            setStepPercentage(Math.floor((interval.current / 15) * 100));
        }, 1000);
        const stepTimeout = setTimeout(() => {
            setCurrentStep((c) => {
                if (c < steps.length) {
                    return c + 1;
                } else {
                    return 1;
                }
            });
            interval.current = 0;
        }, STEP_TIME);

        return () => {
            clearInterval(percentageInterval);
            clearTimeout(stepTimeout);
        };
    }, [currentStep, progressPercentage]);

    const sliderMarkup = steps?.map((step) => {
        const key = `nav-item-${step}`;
        const isSelected = currentStep === step;

        return (
            <NavItem key={key} $selected={isSelected} onClick={() => handleStepClick(step)}>
                <LinearProgress value={0} variant="tiny" />
                {isSelected ? (
                    <NavItemCurrent layoutId="selected" key={`selected:${key}`}>
                        <LinearProgress value={stepPercentage} variant="tiny" />
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
