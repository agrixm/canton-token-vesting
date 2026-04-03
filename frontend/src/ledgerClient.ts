// Copyright (c) 2024 Digital Asset (Canton) Core Team. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  CreateCommand,
  ExerciseCommand,
  QueryCommand,
  Command,
  PackageId,
} from "@daml/ledger";
import {
  VestingAdmin,
  TokenVesting,
  VestingSchedule,
} from "@daml.js/canton-token-vesting-0.1.0";

// --- Configuration ---
// These values are typically stored in a .env file and accessed via process.env
const LEDGER_URL = process.env.REACT_APP_LEDGER_URL || "http://localhost:7575";
const PARTY_JWT = process.env.REACT_APP_PARTY_JWT;
if (!PARTY_JWT) {
  console.warn(
    "REACT_APP_PARTY_JWT is not set. UI will not be able to interact with the ledger. Please set it in your .env file."
  );
}

// Helper to extract the party from a JWT. This is a simple, insecure decode
// and should be replaced with a proper JWT library in production.
const decodeJwt = (token: string): { aud: string[]; [key: string]: any } => {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch (e) {
    throw new Error("Invalid JWT token provided.");
  }
};

export const party = PARTY_JWT ? decodeJwt(PARTY_JWT).aud[0] : undefined;

// --- API Wrapper ---

/**
 * A generic function to send requests to the Canton JSON API.
 * @param endpoint The API endpoint to hit (e.g., /v1/create).
 * @param body The JSON body of the request.
 * @returns The JSON response from the API.
 */
async function apiRequest<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  if (!PARTY_JWT) {
    throw new Error(
      "Cannot send request: Ledger party JWT is not configured."
    );
  }

  const response = await fetch(`${LEDGER_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PARTY_JWT}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error (${response.status}) on ${endpoint}:`, errorBody);
    throw new Error(`Request to ${endpoint} failed with status ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

// --- Type Definitions for API Payloads and Responses ---

type DamlContract<T> = {
  contractId: string;
  templateId: string;
  payload: T;
};

type ApiResponse<T> = {
  result: T;
  status: number;
  warnings?: any;
};

// --- Ledger Interaction Functions ---

/**
 * Fetches all active vesting-related contracts visible to the current party.
 * This includes pending grants and active vesting agreements.
 */
export const fetchContracts = async (): Promise<{
  grants: DamlContract<VestingAdmin.Grant>[];
  agreements: DamlContract<TokenVesting.VestingAgreement>[];
}> => {
  const query: QueryCommand = {
    templateIds: [
      VestingAdmin.Grant.templateId,
      TokenVesting.VestingAgreement.templateId,
    ],
  };

  const response = await apiRequest<ApiResponse<DamlContract<any>[]>>(
    "/v1/query",
    query
  );

  const grants = response.result.filter(
    (c) => c.templateId === VestingAdmin.Grant.templateId
  );
  const agreements = response.result.filter(
    (c) => c.templateId === TokenVesting.VestingAgreement.templateId
  );

  return { grants, agreements };
};

/**
 * Creates a new vesting grant proposal.
 * @param grant The payload for the VestingAdmin.Grant template.
 */
export const createVestingGrant = async (
  grant: VestingAdmin.Grant
): Promise<ApiResponse<DamlContract<VestingAdmin.Grant>>> => {
  const command: CreateCommand<VestingAdmin.Grant> = {
    templateId: VestingAdmin.Grant.templateId,
    payload: grant,
  };
  return apiRequest<ApiResponse<DamlContract<VestingAdmin.Grant>>>(
    "/v1/create",
    command
  );
};

/**
 * Exercises the Grant_Accept choice on a VestingAdmin.Grant contract.
 * @param contractId The Contract ID of the grant to accept.
 */
export const acceptVestingGrant = async (
  contractId: string
): Promise<ApiResponse<{ exerciseResult: string }>> => {
  const command: ExerciseCommand<VestingAdmin.Grant, {}> = {
    templateId: VestingAdmin.Grant.templateId,
    contractId,
    choice: "Grant_Accept",
    argument: {},
  };
  return apiRequest("/v1/exercise", command);
};

/**
 * Exercises the VestingAgreement_Claim choice to claim vested tokens.
 * @param contractId The Contract ID of the VestingAgreement.
 * @param claimTime The ISO 8601 timestamp for the claim.
 */
export const claimVestedTokens = async (
  contractId: string,
  claimTime: string
): Promise<ApiResponse<{ exerciseResult: string }>> => {
  const argument: TokenVesting.VestingAgreement_Claim = { claimTime };
  const command: ExerciseCommand<
    TokenVesting.VestingAgreement,
    TokenVesting.VestingAgreement_Claim
  > = {
    templateId: TokenVesting.VestingAgreement.templateId,
    contractId,
    choice: "VestingAgreement_Claim",
    argument,
  };
  return apiRequest("/v1/exercise", command);
};

/**
 * Exercises the VestingAgreement_Revoke choice.
 * @param contractId The Contract ID of the VestingAgreement to revoke.
 * @param revokeTime The ISO 8601 timestamp for the revocation.
 * @param reason A string explaining why the vesting was revoked.
 */
export const revokeVesting = async (
  contractId: string,
  revokeTime: string,
  reason: string
): Promise<ApiResponse<{ exerciseResult: string }>> => {
  const argument: TokenVesting.VestingAgreement_Revoke = {
    revokeTime,
    reason,
  };
  const command: ExerciseCommand<
    TokenVesting.VestingAgreement,
    TokenVesting.VestingAgreement_Revoke
  > = {
    templateId: TokenVesting.VestingAgreement.templateId,
    contractId,
    choice: "VestingAgreement_Revoke",
    argument,
  };
  return apiRequest("/v1/exercise", command);
};

/**
 * Exercises the VestingAgreement_Accelerate choice.
 * @param contractId The Contract ID of the VestingAgreement to accelerate.
 * @param eventTime The ISO 8601 timestamp of the liquidity event.
 */
export const accelerateVesting = async (
  contractId: string,
  eventTime: string
): Promise<ApiResponse<{ exerciseResult: string }>> => {
  const argument: TokenVesting.VestingAgreement_Accelerate = { eventTime };
  const command: ExerciseCommand<
    TokenVesting.VestingAgreement,
    TokenVesting.VestingAgreement_Accelerate
  > = {
    templateId: TokenVesting.VestingAgreement.templateId,
    contractId,
    choice: "VestingAgreement_Accelerate",
    argument,
  };
  return apiRequest("/v1/exercise", command);
};

// --- Exporting a client object ---

export const ledgerClient = {
  party,
  fetchContracts,
  createVestingGrant,
  acceptVestingGrant,
  claimVestedTokens,
  revokeVesting,
  accelerateVesting,
};