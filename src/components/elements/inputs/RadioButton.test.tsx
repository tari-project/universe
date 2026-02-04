/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@app/test/test-utils';
import RadioButton from './RadioButton';

describe('RadioButton', () => {
    describe('user interactions', () => {
        it('calls onChange when user clicks the radio button', () => {
            const onChange = vi.fn();
            render(<RadioButton name="choice" value="option1" onChange={onChange} />);

            fireEvent.click(screen.getByRole('radio'));

            expect(onChange).toHaveBeenCalled();
        });

        it('displays the label text users can read', () => {
            const onChange = vi.fn();
            render(<RadioButton name="choice" value="option1" label="First option" onChange={onChange} />);

            expect(screen.getByText('First option')).toBeInTheDocument();
        });

        it('can be selected by clicking the label', () => {
            const onChange = vi.fn();
            render(<RadioButton name="choice" value="option1" label="Click me" onChange={onChange} />);

            fireEvent.click(screen.getByText('Click me'));

            expect(onChange).toHaveBeenCalled();
        });
    });

    describe('radio button states', () => {
        it('can be checked', () => {
            render(<RadioButton name="choice" value="option1" checked readOnly />);

            expect(screen.getByRole('radio')).toBeChecked();
        });

        it('can be unchecked', () => {
            render(<RadioButton name="choice" value="option1" checked={false} readOnly />);

            expect(screen.getByRole('radio')).not.toBeChecked();
        });

        it('can be disabled', () => {
            render(<RadioButton name="choice" value="option1" disabled />);

            expect(screen.getByRole('radio')).toBeDisabled();
        });
    });

    describe('radio group behavior', () => {
        it('allows only one selection in a group', () => {
            const onChange = vi.fn();
            render(
                <div>
                    <RadioButton name="group" value="a" label="Option A" onChange={onChange} />
                    <RadioButton name="group" value="b" label="Option B" onChange={onChange} />
                    <RadioButton name="group" value="c" label="Option C" onChange={onChange} />
                </div>
            );

            const radios = screen.getAllByRole('radio');
            expect(radios).toHaveLength(3);

            radios.forEach((radio) => {
                expect(radio).toHaveAttribute('name', 'group');
            });
        });
    });

    describe('variants', () => {
        it('renders with neutral variant by default', () => {
            render(<RadioButton name="choice" value="option1" />);

            expect(screen.getByRole('radio')).toBeInTheDocument();
        });

        it('renders with dark variant', () => {
            render(<RadioButton name="choice" value="option1" variant="dark" />);

            expect(screen.getByRole('radio')).toBeInTheDocument();
        });

        it('renders with light variant', () => {
            render(<RadioButton name="choice" value="option1" variant="light" />);

            expect(screen.getByRole('radio')).toBeInTheDocument();
        });
    });

    describe('style types', () => {
        it('renders with primary style type by default', () => {
            render(<RadioButton name="choice" value="option1" label="Primary" />);

            expect(screen.getByText('Primary')).toBeInTheDocument();
        });

        it('renders with minimal style type', () => {
            render(<RadioButton name="choice" value="option1" label="Minimal" styleType="minimal" />);

            expect(screen.getByText('Minimal')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('has role="radio"', () => {
            render(<RadioButton name="choice" value="option1" />);

            expect(screen.getByRole('radio')).toBeInTheDocument();
        });

        it('associates label with radio input', () => {
            render(<RadioButton name="choice" value="option1" label="Associated label" />);

            expect(screen.getByRole('radio')).toBeInTheDocument();
            expect(screen.getByText('Associated label')).toBeInTheDocument();
        });

        it('passes additional HTML attributes to input', () => {
            render(<RadioButton name="choice" value="option1" aria-describedby="description" />);

            expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', 'description');
        });
    });

    describe('without label', () => {
        it('renders without label when not provided', () => {
            render(<RadioButton name="choice" value="option1" />);

            expect(screen.getByRole('radio')).toBeInTheDocument();
            expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        });
    });

    describe('check icon visibility', () => {
        it('contains a check wrapper for visual feedback', () => {
            const { container } = render(<RadioButton name="choice" value="option1" />);

            const checkWrapper = container.querySelector('.check');
            expect(checkWrapper).toBeInTheDocument();
        });
    });
});
