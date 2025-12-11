import { VALIDATION } from './constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate starting capital
 */
export function validateStartingCapital(value: number): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: 'Starting capital is required' };
  }
  if (value <= VALIDATION.MIN_CAPITAL) {
    return { isValid: false, error: 'Starting capital must be greater than 0' };
  }
  if (value > VALIDATION.MAX_CAPITAL) {
    return { isValid: false, error: 'Starting capital exceeds maximum limit' };
  }
  return { isValid: true };
}

/**
 * Validate ending capital
 */
export function validateEndingCapital(value: number): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: 'Ending capital is required' };
  }
  if (value < VALIDATION.MIN_CAPITAL) {
    return { isValid: false, error: 'Ending capital cannot be negative' };
  }
  if (value > VALIDATION.MAX_CAPITAL) {
    return { isValid: false, error: 'Ending capital exceeds maximum limit' };
  }
  return { isValid: true };
}

/**
 * Validate deposit amount
 */
export function validateDeposit(value: number): ValidationResult {
  if (isNaN(value) || value < VALIDATION.MIN_DEPOSIT) {
    return { isValid: false, error: 'Deposits cannot be negative' };
  }
  return { isValid: true };
}

/**
 * Validate withdrawal amount
 */
export function validateWithdrawal(value: number): ValidationResult {
  if (isNaN(value) || value < VALIDATION.MIN_WITHDRAWAL) {
    return { isValid: false, error: 'Withdrawals cannot be negative' };
  }
  return { isValid: true };
}

/**
 * Validate month format (YYYY-MM)
 */
export function validateMonthFormat(value: string): ValidationResult {
  const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!regex.test(value)) {
    return { isValid: false, error: 'Invalid month format' };
  }
  return { isValid: true };
}

/**
 * Validate all form fields
 */
export function validateMonthForm(
  startingCapital: number,
  endingCapital: number,
  deposits: number,
  withdrawals: number,
  month: string
): ValidationResult {
  const monthValidation = validateMonthFormat(month);
  if (!monthValidation.isValid) return monthValidation;
  
  const startingValidation = validateStartingCapital(startingCapital);
  if (!startingValidation.isValid) return startingValidation;
  
  const endingValidation = validateEndingCapital(endingCapital);
  if (!endingValidation.isValid) return endingValidation;
  
  const depositValidation = validateDeposit(deposits);
  if (!depositValidation.isValid) return depositValidation;
  
  const withdrawalValidation = validateWithdrawal(withdrawals);
  if (!withdrawalValidation.isValid) return withdrawalValidation;
  
  return { isValid: true };
}
