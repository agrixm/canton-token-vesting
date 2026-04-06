// Copyright (c) 2024 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A TypeScript client for interacting with a Canton ledger's JSON API.
 * This module provides typed wrappers for common ledger operations like
 * creating contracts, exercising choices, and querying the active contract set.
 */

// --- Configuration ---

// These should ideally be loaded from environment variables
const LEDGER_HOST = process.env.REACT_APP_LEDGER_HOST || 'localhost';
const LEDGER_PORT = process.env.REACT_APP_LEDGER_PORT || 7575;
const LEDGER_BASE_URL = `http://${LEDGER_HOST}:${LEDGER_PORT}/v1`;

// --- Type Definitions for Canton JSON API ---

/**
 * Represents an active contract on the ledger.
 * @template T The type of the contract payload.
 */
export interface ActiveContract<T = any> {
  contractId: string;
  templateId: string;
  payload: T;
  agreementText: string;
  signatories: string[];
  observers: string[];
}

/**
 * Payload for a 'create' command.
 * @template T The type of the contract payload.
 */
export interface CreateCommand<T = any> {
  templateId: string; // e.g., "TokenVesting.Vesting:VestingSchedule"
  payload: T;
}

/**
 * Payload for an 'exercise' command.
 * @template T The type of the choice argument.
 */
export interface ExerciseCommand<T = any> {
  templateId: string;
  contractId: string;
  choice: string;
  argument: T;
}

/**
 * Payload for a 'query' command.
 * @template T The type of the query filter object.
 */
export interface Query<T = any> {
  templateIds: string[];
  query?: T;
}

/**
 * Represents the structured response from the JSON API.
 */
export interface ApiResponse<T> {
  result?: T;
  errors?: string[];
  status: number;
}

/**
 * Represents the result of an exercise command.
 * @template R The return type of the choice.
 */
export interface ExerciseResult<R> {
    exerciseResult: R;
    events: { created: ActiveContract }[] | { archived: { contractId: string } }[];
}


// --- API Client Implementation ---

// A simple mechanism to hold the auth token for the current session.
// In a real application, this would be managed by a more robust auth library
// and likely stored in localStorage or sessionStorage.
let authToken: string | null = null;

/**
 * Sets the JWT for authenticating subsequent requests to the JSON API.
 * @param {string} token The JWT token string.
 */
export const setAuthToken = (token: string): void => {
  authToken = token;
};

/**
 * Clears the currently stored JWT, effectively logging the user out.
 */
export const clearAuthToken = (): void => {
  authToken = null;
};

/**
 * A generic fetch wrapper for making POST requests to the Canton JSON API.
 * It automatically includes the authorization token and handles basic error conditions.
 * @template T The expected type of the `result` field in the API response.
 * @param {string} endpoint The API endpoint (e.g., 'create', 'exercise', 'query').
 * @param {object} body The request payload.
 * @returns {Promise<ApiResponse<T>>} The full JSON response from the API.
 */
async function apiFetch<T>(endpoint: string, body: object): Promise<ApiResponse<T>> {
  if (!authToken) {
    throw new Error('Authentication token not set. Please call setAuthToken first.');
  }

  const url = `${LEDGER_BASE_URL}/${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      console.error(`API Error (${response.status}) on endpoint ${endpoint}:`, responseBody);
      const errorMsg = responseBody.errors?.join(', ') || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }
    
    return responseBody as ApiResponse<T>;

  } catch (error) {
    console.error(`Network or fetch error calling ${url}:`, error);
    // Re-throw to allow higher-level components to handle it.
    throw error;
  }
}

/**
 * Creates a new contract on the ledger.
 * @template T The type of the contract payload.
 * @param {CreateCommand<T>} command The create command payload.
 * @returns {Promise<ActiveContract<T>>} A promise that resolves to the created contract.
 */
export const createContract = async <T>(command: CreateCommand<T>): Promise<ActiveContract<T>> => {
  const response = await apiFetch<ActiveContract<T>>('create', command);
  if (response.errors || !response.result) {
    throw new Error(`Failed to create contract: ${response.errors?.join(', ') || 'Unknown error'}`);
  }
  return response.result;
};

/**
 * Exercises a choice on an existing contract.
 * @template T The type of the choice argument.
 * @template R The return type of the choice.
 * @param {ExerciseCommand<T>} command The exercise command payload.
 * @returns {Promise<ExerciseResult<R>>} A promise that resolves to the result of the choice exercise,
 *          which includes the return value and any resulting events.
 */
export const exerciseChoice = async <T, R>(command: ExerciseCommand<T>): Promise<ExerciseResult<R>> => {
  const response = await apiFetch<ExerciseResult<R>>('exercise', command);
  if (response.errors || !response.result) {
    throw new Error(`Failed to exercise choice '${command.choice}': ${response.errors?.join(', ') || 'Unknown error'}`);
  }
  return response.result;
};

/**
 * Queries the ledger for active contracts matching the given criteria.
 * @template T The type of the contract payload.
 * @param {Query} query The query payload.
 * @returns {Promise<ActiveContract<T>[]>} A promise that resolves to an array of active contracts.
 *          Returns an empty array if no contracts are found.
 */
export const queryContracts = async <T>(query: Query): Promise<ActiveContract<T>[]> => {
  const response = await apiFetch<ActiveContract<T>[] | undefined>('query', query);
  if (response.errors) {
    throw new Error(`Failed to query contracts: ${response.errors.join(', ')}`);
  }
  // The query endpoint returns an empty result field if there are no matching contracts.
  return response.result || [];
};

/**
 * Fetches a single active contract by its ID.
 * @template T The type of the contract payload.
 * @param {string} contractId The ID of the contract to fetch.
 * @returns {Promise<ActiveContract<T> | null>} The active contract or null if not found or archived.
 */
export const fetchContractById = async <T>(contractId: string): Promise<ActiveContract<T> | null> => {
    const payload = { contractId };
    try {
        const response = await apiFetch<ActiveContract<T>>('fetch', payload);
        if (response.errors || !response.result) {
            // This can happen if the contract is not visible to the party or has been archived.
            return null;
        }
        return response.result;
    } catch (error) {
        // A 404 error from the API typically means the contract doesn't exist.
        // We can treat this as "not found" rather than a critical failure.
        if (error instanceof Error && error.message.includes('404')) {
            return null;
        }
        // Re-throw other errors
        throw error;
    }
};