import React, { useState, useEffect } from 'react';
// In a real application, you would import a BIP39 library here, e.g.:
// import * as bip39 from 'bip39';

import {
    ConfirmButton,
    ConfirmationTick,
    ErrorMessage,
    SeedImportDescription,
    SeedImportSection,
    SeedImportTitle,
    SeedInputContainer,
} from './SeedImport.styles';

/**
 * Placeholder for mnemonic validation logic.
 * In a real application, this function would use a library like 'bip39'
 * to validate the mnemonic against a specific wordlist (e.g., English).
 *
 * @param mnemonic The cleaned mnemonic string (space-separated lowercase words).
 * @returns An object indicating validity and an optional error message.
 */
const validateMnemonicWords = (mnemonic: string): { isValid: boolean; error?: string } => {
    const words = mnemonic.split(' ');

    // Basic checks for BIP39 compatibility (common lengths)
    if (words.length < 12 || words.length % 3 !== 0 || words.length > 24) {
        return { isValid: false, error: 'Mnemonic phrase must contain 12, 15, 18, 21, or 24 words.' };
    }

    // Simulate wordlist validation: checks if words are reasonably formed.
    // This is a placeholder; a real BIP39 library would perform a strict check
    // against its defined wordlist (e.g., bip39.validateMnemonic(mnemonic, bip39.wordlists.english)).
    if (!words.every((word) => word.length > 1 && /^[a-z]+$/.test(word))) {
        return {
            isValid: false,
            error: 'Mnemonic Error: Contains invalid characters or words not found in common wordlists.',
        };
    }

    // If using a real library:
    // try {
    //   const isValidBip39 = bip39.validateMnemonic(mnemonic, bip39.wordlists.english);
    //   return { isValid: isValidBip39, error: isValidBip39 ? undefined : 'Mnemonic is not valid according to BIP39 English wordlist.' };
    // } catch (e: any) {
    //   return { isValid: false, error: `Mnemonic validation failed: ${e.message}` };
    // }

    return { isValid: true }; // Assume valid after basic checks and cleaning
};

/**
 * Cleans a raw mnemonic input string: normalises whitespace and lowercases all words.
 * BIP39 mnemonics are case-insensitive; normalising to lowercase avoids spurious
 * "unsupported language" errors that occur when the library encounters capitalised words.
 */
const cleanMnemonic = (raw: string): string =>
    raw
        .replace(/\s+/g, ' ')  // collapse all whitespace (including newlines) to single spaces
        .trim()
        .toLowerCase();

const SeedImport = () => {
    const [seedInput, setSeedInput] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isTouched, setIsTouched] = useState(false); // Tracks if the user has interacted with the input

    useEffect(() => {
        // Only perform validation if the user has interacted with the input
        if (!isTouched) {
            return;
        }

        const cleanedInput = cleanMnemonic(seedInput);

        // If after cleaning, the input is empty (e.g., only whitespace was entered)
        if (cleanedInput === '') {
            setIsValid(false);
            setErrorMessage('');
            return;
        }

        const validationResult = validateMnemonicWords(cleanedInput);
        setIsValid(validationResult.isValid);
        setErrorMessage(validationResult.error || '');
    }, [seedInput, isTouched]); // Re-run effect when seedInput or isTouched changes

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSeedInput(event.target.value);
        if (!isTouched) {
            setIsTouched(true); // Mark as touched on first change
        }
    };

    const handleConfirm = () => {
        // Clean the input before passing it to the wallet import logic to ensure
        // the same normalised string that passed validation is used for import.
        const cleanedSeed = cleanMnemonic(seedInput);
        console.log('Importing wallet with seed:', cleanedSeed);
        // e.g., invoke a Tauri command: invoke('import_wallet', { mnemonic: cleanedSeed });
        alert('Wallet import initiated (see console for mnemonic value).');
    };

    const inputStatus = errorMessage ? 'error' : isValid && isTouched ? 'success' : '';

    return (
        <SeedImportSection>
            <SeedImportTitle>Import Wallet from Seed Words</SeedImportTitle>
            <SeedImportDescription>
                Enter your 12 or 24 seed words, separated by spaces or newlines.
            </SeedImportDescription>
            <SeedInputContainer $status={inputStatus}>
                <textarea
                    value={seedInput}
                    onChange={handleChange}
                    onBlur={() => setIsTouched(true)} // Ensure validation runs if user just focuses and blurs
                    placeholder={'e.g., word1 word2 word3 ...\nor copy-paste a phrase like:\nword1\nword2\nword3'}
                    rows={5}
                    aria-label="Seed words input"
                />
                {isTouched && isValid && <ConfirmationTick aria-label="Valid mnemonic">✓</ConfirmationTick>}
            </SeedInputContainer>
            {isTouched && errorMessage && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}
            <ConfirmButton onClick={handleConfirm} disabled={!isValid}>
                Confirm Import
            </ConfirmButton>
        </SeedImportSection>
    );
};

export default SeedImport;
