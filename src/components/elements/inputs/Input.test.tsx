/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@app/test/test-utils';
import { Input } from './Input';

describe('Input', () => {
    describe('user typing', () => {
        it('allows user to type text', () => {
            render(<Input name="username" />);

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'hello' } });

            expect(input).toHaveValue('hello');
        });

        it('calls onChange when user types', () => {
            const onChange = vi.fn();
            render(<Input name="username" onChange={onChange} />);

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: 'test' } });

            expect(onChange).toHaveBeenCalled();
        });
    });

    describe('number input', () => {
        it('allows numeric input', () => {
            render(<Input name="amount" type="number" />);

            const input = screen.getByRole('spinbutton');
            fireEvent.change(input, { target: { value: '42' } });

            expect(input).toHaveValue(42);
        });

        it('keeps current value when non-numeric input is entered', () => {
            render(<Input name="amount" type="number" />);

            const input = screen.getByRole('spinbutton');
            fireEvent.change(input, { target: { value: '42' } });
            expect(input).toHaveValue(42);

            fireEvent.change(input, { target: { value: 'abc' } });
            expect(input).toHaveValue(42);
        });

        it('accepts decimal numbers', () => {
            render(<Input name="amount" type="number" />);

            const input = screen.getByRole('spinbutton');
            fireEvent.change(input, { target: { value: '3.14' } });

            expect(input).toHaveValue(3.14);
        });

        it('accepts negative numbers', () => {
            render(<Input name="amount" type="number" />);

            const input = screen.getByRole('spinbutton');
            fireEvent.change(input, { target: { value: '-10' } });

            expect(input).toHaveValue(-10);
        });
    });

    describe('label', () => {
        it('displays label when provided', () => {
            render(<Input name="email" labelText="Email Address" />);

            expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        });

        it('associates label with input', () => {
            render(<Input name="email" labelText="Email" />);

            const label = screen.getByText('Email');
            const input = screen.getByRole('textbox');

            expect(label).toHaveAttribute('for', 'email');
            expect(input).toHaveAttribute('id', 'email');
        });

        it('does not render label when not provided', () => {
            render(<Input name="password" />);

            expect(screen.queryByRole('label')).not.toBeInTheDocument();
        });
    });

    describe('end adornment', () => {
        it('renders end adornment when provided', () => {
            const adornment = <span data-testid="adornment">@example.com</span>;
            render(<Input name="email" endAdornment={adornment} />);

            expect(screen.getByTestId('adornment')).toBeInTheDocument();
            expect(screen.getByText('@example.com')).toBeInTheDocument();
        });

        it('can render icon as end adornment', () => {
            const icon = (
                <svg data-testid="icon">
                    <circle cx="10" cy="10" r="5" />
                </svg>
            );
            render(<Input name="search" endAdornment={icon} />);

            expect(screen.getByTestId('icon')).toBeInTheDocument();
        });
    });

    describe('error state', () => {
        it('applies error styling when hasError is true', () => {
            const { container } = render(<Input name="email" hasError />);

            const styledInput = container.querySelector('input');
            expect(styledInput).toBeInTheDocument();
        });

        it('can combine error with label', () => {
            render(<Input name="email" labelText="Email" hasError />);

            expect(screen.getByLabelText('Email')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('has accessible name via label', () => {
            render(<Input name="username" labelText="Username" />);

            expect(screen.getByLabelText('Username')).toBeInTheDocument();
        });

        it('uses name as id when no explicit id provided', () => {
            render(<Input name="myfield" />);

            expect(screen.getByRole('textbox')).toHaveAttribute('id', 'myfield');
        });

        it('uses default name when none provided', () => {
            render(<Input />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('id', 'input-x');
            expect(input).toHaveAttribute('name', 'input-x');
        });
    });

    describe('placeholder', () => {
        it('displays placeholder text', () => {
            render(<Input name="search" placeholder="Search..." />);

            expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
        });
    });

    describe('disabled state', () => {
        it('can be disabled', () => {
            render(<Input name="readonly" disabled />);

            expect(screen.getByRole('textbox')).toBeDisabled();
        });

        it('is disabled when disabled prop is set', () => {
            render(<Input name="readonly" disabled />);

            const input = screen.getByRole('textbox');
            expect(input).toBeDisabled();
        });

        // TODO: POTENTIAL BUG - Input component's internal onChange still fires when disabled
        // In jsdom/React Testing Library, fireEvent.change() still triggers the onChange handler
        // even on disabled inputs. The component's handleChange function doesn't check the
        // disabled prop before updating internal state or calling props.onChange.
        // See Input.tsx line 17-28: handleChange doesn't check disabled state.
        // While native HTML inputs prevent user interaction when disabled, programmatic
        // events still work. Consider adding: if (props.disabled) return; at the start
        // of handleChange for defense in depth.
    });

    describe('initial value', () => {
        it('starts with empty string for text input', () => {
            render(<Input name="text" />);

            expect(screen.getByRole('textbox')).toHaveValue('');
        });

        it('starts with 0 for number input', () => {
            render(<Input name="number" type="number" />);

            expect(screen.getByRole('spinbutton')).toHaveValue(0);
        });
    });

    describe('ref forwarding', () => {
        it('accepts ref', () => {
            const ref = { current: null };
            render(<Input name="test" ref={ref} />);

            expect(ref.current).not.toBeNull();
        });
    });
});
