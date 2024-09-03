import styled, { css } from 'styled-components';
import { HiOutlineSelector } from 'react-icons/hi';
import { useState, MouseEvent } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import { SpinnerIcon } from '@app/components/elements/SpinnerIcon.tsx';
import CheckSvg from '@app/components/svgs/CheckSvg.tsx';
import { useClickOutside } from '@app/hooks/helpers/useClickOutside.ts';

const Wrapper = styled.div<{ $disabled?: boolean }>`
    width: 100%;
    background: ${({ theme }) => theme.palette.background.paper};
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    ${({ $disabled }) =>
        $disabled &&
        css`
            pointer-events: none;
            opacity: 0.8;
        `}
`;

const StyledSelect = styled.div`
    display: flex;
    flex-direction: column;
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 500;
    position: relative;
    letter-spacing: -1px;
`;

const Options = styled.div<{ $open?: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    position: absolute;
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    background: ${({ theme }) => theme.palette.background.paper};
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    z-index: 1;
    height: ${({ $open }) => ($open ? 'auto' : 0)};
    opacity: ${({ $open }) => ($open ? 1 : 0)};
    pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
    transition: all 0.1s ease-in;

    left: 0;
    top: 100%;
    transform: translate(-10px, 10px); // TODO: check bounding box stuff or use react popover

    min-width: 220px;
    padding: 9px 12px;

    align-items: flex-start;
    gap: 6px;
`;

const SelectedOption = styled.div<{ $selected?: boolean }>`
    font-size: 15px;
`;
const StyledOption = styled.div<{ $selected?: boolean }>`
    display: flex;
    font-size: 14px;
    background: ${({ theme }) => theme.palette.background.paper};
    text-transform: uppercase;
    line-height: 1;
    cursor: pointer;
    border-radius: 10px;
    transition: all 0.2s ease-in-out;

    height: 36px;
    padding: 13px 7px;
    justify-content: space-between;
    align-items: center;
    align-self: stretch;

    background: ${({ theme, $selected }) => ($selected ? theme.palette.colors.darkAlpha[5] : 'none')};
    &:hover {
        background: ${({ theme }) => theme.palette.colors.darkAlpha[10]};
    }
`;

const IconWrapper = styled.div`
    display: flex;
    width: 21px;
    height: 21px;
    align-items: center;
    justify-content: center;
    border-radius: 100%;
    background: ${({ theme }) => theme.palette.background.paper};
    color: ${({ theme }) => theme.palette.text.primary};

    svg {
        width: 100%;
        height: 100%;
        color: ${({ theme }) => theme.palette.text.primary};
    }
`;

interface Option {
    label: string;
    selectedLabel?: string;
    value: string;
}

interface Props {
    disabled?: boolean;
    loading?: boolean;
    options: Option[];
    selectedValue?: Option['value'];
    onChange: (value: Option['value']) => void;
}

type OnClickEvent = MouseEvent<HTMLDivElement>;

export function Select({ options, selectedValue, disabled, loading, onChange, ...props }: Props) {
    const [expanded, setExpanded] = useState(false);
    function toggleOpen(e: OnClickEvent) {
        e.stopPropagation();
        setExpanded((c) => !c);
    }

    function handleChange(e: OnClickEvent, value: string) {
        e.stopPropagation();
        onChange(value);
        setExpanded(false);
    }
    const clickRef = useClickOutside(() => setExpanded(false), expanded);
    const selectedOption = selectedValue ? options.find((o) => o.value === selectedValue) : options[0];
    const selectedLabel = selectedOption?.selectedLabel || selectedOption?.label;
    return (
        <Wrapper onClick={(e) => toggleOpen(e)} $disabled={disabled}>
            <StyledSelect {...props}>
                <SelectedOption $selected>
                    <Typography>{selectedLabel}</Typography>
                </SelectedOption>
                <Options ref={clickRef} id="select-options" tabIndex={0} $open={expanded}>
                    {options.map(({ label, value }) => {
                        const selected = value === selectedOption?.value;
                        return (
                            <StyledOption
                                onClick={(e) => handleChange(e, value)}
                                key={`opt-${value}-${label}`}
                                $selected={selected}
                            >
                                <Typography>{label}</Typography>
                                {selected ? (
                                    <IconWrapper>
                                        <CheckSvg />
                                    </IconWrapper>
                                ) : null}
                            </StyledOption>
                        );
                    })}
                </Options>
            </StyledSelect>
            <IconWrapper>{loading ? <SpinnerIcon /> : <HiOutlineSelector />}</IconWrapper>
        </Wrapper>
    );
}
