import * as m from 'motion/react-m';
import styled from 'styled-components';

interface ProgressProps {
    percentage: number;
}
export function Progress({ percentage }: ProgressProps) {
    return (
        <div>
            <m.svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <m.path
                    opacity="0.3"
                    d="M26 14C26 16.3734 25.2962 18.6935 23.9776 20.6669C22.6591 22.6403 20.7849 24.1783 18.5922 25.0866C16.3995 25.9948 13.9867 26.2325 11.6589 25.7695C9.33114 25.3064 7.19294 24.1635 5.51471 22.4853C3.83647 20.8071 2.69358 18.6689 2.23055 16.3411C1.76752 14.0133 2.00516 11.6005 2.91341 9.40783C3.82166 7.21511 5.35972 5.34097 7.33311 4.02238C9.3065 2.7038 11.6266 2.00001 14 2"
                    stroke="white"
                    strokeWidth="3.84"
                />
                <m.path
                    d="M14 2C16.2131 2 18.3831 2.61199 20.27 3.76832C22.157 4.92465 23.6874 6.58026 24.6921 8.55212C25.6968 10.524 26.1367 12.7353 25.963 14.9415C25.7894 17.1478 25.009 19.263 23.7082 21.0534"
                    stroke="white"
                    strokeWidth="3.84"
                    strokeLinecap="round"
                />
            </m.svg>
        </div>
    );
}
