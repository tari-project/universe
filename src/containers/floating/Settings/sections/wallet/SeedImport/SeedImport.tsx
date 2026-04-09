import React, { useState, useEffect } from 'react';
// In a real application, you would import a BIP39 library here, e.g.:
// import * as bip39 from 'bip39';

/**
 * Placeholder for mnemonic validation logic.
 * In a real application, this function would use a library like 'bip39'
 * to validate the mnemonic against a specific wordlist (e.g., English).
 *
 * @param mnemonic The cleaned mnemonic string (space-separated words).
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
  if (!words.every(word => word.length > 1 && /^[a-z]+$/.test(word))) {
    return { isValid: false, error: 'Mnemonic Error: Contains invalid characters or words not found in common wordlists.' };
  }

  // Simulate language detection error as described in the issue,
  // if input cleaning was *not* performed. This part is
  // conceptually handled by the cleaning, but kept here for context.
  // The original issue error: "Only ChineseSimplified, ChineseTraditional, English, French, Italian, Japanese, Korean and Spanish are defined natural languages"
  // implies a library is trying to infer language, which fails on raw input.
  // After cleaning, if the words are valid English (or another supported language),
  // this error should not occur. For this example, we assume English.

  // If using a real library:
  // try {
  //   const isValidBip39 = bip39.validateMnemonic(mnemonic, bip39.wordlists.english);
  //   return { isValid: isValidBip39, error: isValidBip39 ? undefined : 'Mnemonic is not valid according to BIP39 English wordlist.' };
  // } catch (e: any) {
  //   return { isValid: false, error: `Mnemonic validation failed: ${e.message}` };
  // }

  return { isValid: true }; // Assume valid after basic checks and cleaning
};

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

    const rawInput = seedInput;
    if (rawInput.trim() === '') {
      setIsValid(false);
      setErrorMessage('');
      return;
    }

    // FIX: Clean the input string to handle newlines and multiple spaces
    // 1. Replace one or more newline characters (CR/LF) with a single space.
    // 2. Replace any sequence of one or more whitespace characters (including new spaces from step 1) with a single space.
    // 3. Trim leading/trailing whitespace.
    const cleanedInput = rawInput
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // If after cleaning, the input is empty (e.g., only whitespace was entered)
    if (cleanedInput === '') {
      setIsValid(false);
      setErrorMessage('Mnemonic cannot be empty.');
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
    // This is where you would typically trigger the wallet import process
    // using the cleaned and validated seed words (available via `seedInput` after cleaning).
    console.log('Importing wallet with seed:', seedInput);
    // e.g., invoke a Tauri command: invoke('import_wallet', { mnemonic: seedInput });
    alert('Wallet import initiated (see console for mnemonic value).');
  };

  const inputStatusClass = errorMessage
    ? 'input-error'
    : isValid && isTouched // Only show success if touched and valid
      ? 'input-success'
      : '';

  return (
    <div className="seed-import-section">
      <h3>Import Wallet from Seed Words</h3>
      <p>Enter your 12 or 24 seed words, separated by spaces or newlines.</p>
      <div className={`seed-input-container ${inputStatusClass}`}>
        <textarea
          value={seedInput}
          onChange={handleChange}
          onBlur={() => setIsTouched(true)} // Ensure validation runs if user just focuses and blurs
          placeholder="e.g., word1 word2 word3 ... &#10;or copy-paste a phrase like: &#10;word1 &#10;word2 &#10;word3"
          rows={5}
          className="seed-textarea"
          aria-label="Seed words input"
        />
        {isTouched && isValid && (
          <span className="confirmation-tick" aria-label="Valid mnemonic">✓</span>
        )}
      </div>
      {isTouched && errorMessage && (
        <p className="error-message" role="alert">{errorMessage}</p>
      )}
      <button onClick={handleConfirm} disabled={!isValid} className="confirm-button">
        Confirm Import
      </button>
      <style>{`
        .seed-import-section {
          padding: 20px;
          max-width: 500px;
          margin: 20px auto;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: #ffffff;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          font-family: sans-serif;
          color: #333;
        }
        .seed-import-section h3 {
          color: #2c3e50;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .seed-import-section p {
          font-size: 0.95em;
          line-height: 1.5;
          margin-bottom: 20px;
          color: #555;
        }
        .seed-input-container {
          position: relative;
          margin-bottom: 15px;
        }
        .seed-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1em;
          box-sizing: border-box;
          resize: vertical;
          min-height: 120px;
          transition: border-color 0.2s ease-in-out;
        }
        .seed-textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }
        .input-error .seed-textarea {
          border-color: #dc3545;
        }
        .input-success .seed-textarea {
          border-color: #28a745;
        }
        .error-message {
          color: #dc3545;
          font-size: 0.9em;
          margin-top: -5px;
          margin-bottom: 10px;
          padding-left: 5px;
        }
        .confirmation-tick {
          position: absolute;
          right: 15px;
          top: 15px;
          color: #28a745;
          font-size: 1.6em;
          pointer-events: none; /* Allows clicks to pass through to textarea */
          background-color: #ffffff;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .confirm-button {
          width: 100%;
          padding: 12px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1.1em;
          font-weight: bold;
          transition: background-color 0.2s ease-in-out, opacity 0.2s ease-in-out;
        }
        .confirm-button:hover:not(:disabled) {
          background-color: #0056b3;
        }
        .confirm-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default SeedImport;
