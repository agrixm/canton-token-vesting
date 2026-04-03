import { fetchFromLedger, Contract } from './ledgerClient';

// Assuming the main Daml module is named 'Vesting'
const VESTING_MODULE = 'Vesting';

// --- Type Definitions (mirroring Daml templates) ---

/**
 * Represents the vesting schedule parameters.
 * Mirrors `VestingSchedule.Schedule`.
 */
export interface VestingSchedule {
  grantDate: string; // ISO Date "YYYY-MM-DD"
  cliffDurationDays: string; // Text representation of a number
  totalVestingDurationDays: string; // Text representation of a number
}

/**
 * Payload for creating a new vesting grant proposal.
 */
export interface GrantProposalPayload {
  issuer: string;
  grantee: string;
  admin: string;
  schedule: VestingSchedule;
  tokenTicker: string;
  totalAmount: string; // Decimal as string, e.g., "10000.00"
  revocable: boolean;
  // `accelerationClause` would be added here if needed
}

/**
 * Represents a `Vesting.GrantProposal` contract on the ledger.
 */
export type GrantProposal = Contract<GrantProposalPayload>;

/**
 * Represents a `Vesting.AcceptedGrant` contract on the ledger.
 * Payload is similar to proposal, but now signed by the grantee.
 */
export type AcceptedGrant = Contract<GrantProposalPayload>;


/**
 * Represents the payload of an active `Vesting.VestingGrant` contract.
 */
export interface VestingGrantPayload extends GrantProposalPayload {
  amountClaimed: string; // Decimal as string
  lastClaimTimestamp: string; // ISO DateTime with Z
  isRevoked: boolean;
  revocationReason: string | null;
}

/**
 * Represents an active `Vesting.VestingGrant` contract on the ledger.
 */
export type VestingGrant = Contract<VestingGrantPayload>;


// --- Service Functions ---

/**
 * Fetches all pending grant proposals for a given party.
 * This can be the issuer who can withdraw it, or the grantee who can accept it.
 * @param token - The authentication token for the JSON API.
 * @returns A promise that resolves to an array of GrantProposal contracts.
 */
export const getGrantProposals = async (token: string): Promise<GrantProposal[]> => {
  const response = await fetchFromLedger<{ result: GrantProposal[] }>(
    'v1/query',
    token,
    { templateIds: [`${VESTING_MODULE}:GrantProposal`] }
  );
  return response.result;
};

/**
 * Fetches all grants that have been accepted by the grantee but not yet
 * acknowledged by the issuer.
 * @param token - The authentication token for the JSON API.
 * @returns A promise that resolves to an array of AcceptedGrant contracts.
 */
export const getAcceptedGrants = async (token: string): Promise<AcceptedGrant[]> => {
    const response = await fetchFromLedger<{ result: AcceptedGrant[] }>(
      'v1/query',
      token,
      { templateIds: [`${VESTING_MODULE}:AcceptedGrant`] }
    );
    return response.result;
  };

/**
 * Fetches all active (acknowledged) vesting grants for a given party.
 * @param token - The authentication token for the JSON API.
 * @returns A promise that resolves to an array of VestingGrant contracts.
 */
export const getActiveVestingGrants = async (token: string): Promise<VestingGrant[]> => {
  const response = await fetchFromLedger<{ result: VestingGrant[] }>(
    'v1/query',
    token,
    { templateIds: [`${VESTING_MODULE}:VestingGrant`] }
  );
  return response.result;
};

/**
 * Creates a new grant proposal on the ledger.
 * This is initiated by the issuer.
 * @param token - The authentication token for the JSON API.
 * @param proposal - The details of the vesting grant to propose.
 * @returns The result of the create command.
 */
export const createGrantProposal = async (token: string, proposal: GrantProposalPayload) => {
  return fetchFromLedger('v1/create', token, {
    templateId: `${VESTING_MODULE}:GrantProposal`,
    payload: proposal,
  });
};

/**
 * Exercises the `Accept` choice on a `GrantProposal` contract.
 * This is performed by the grantee.
 * @param token - The authentication token for the JSON API.
 * @param contractId - The contract ID of the `GrantProposal` to accept.
 * @returns The result of the exercise command.
 */
export const acceptGrant = async (token: string, contractId: string) => {
  return fetchFromLedger('v1/exercise', token, {
    templateId: `${VESTING_MODULE}:GrantProposal`,
    contractId,
    choice: 'Accept',
    argument: {},
  });
};

/**
 * Exercises the `Acknowledge` choice on an `AcceptedGrant` contract.
 * This is performed by the issuer to make the grant active.
 * @param token - The authentication token for the JSON API.
 * @param contractId - The contract ID of the `AcceptedGrant` to acknowledge.
 * @returns The result of the exercise command.
 */
export const acknowledgeGrant = async (token: string, contractId: string) => {
    return fetchFromLedger('v1/exercise', token, {
      templateId: `${VESTING_MODULE}:AcceptedGrant`,
      contractId,
      choice: 'Acknowledge',
      argument: {
        acknowledgementTime: new Date().toISOString()
      },
    });
  };

/**
 * Exercises the `Claim` choice on a `VestingGrant` contract.
 * This is performed by the grantee to claim their vested tokens.
 * @param token - The authentication token for the JSON API.
 * @param contractId - The contract ID of the `VestingGrant`.
 * @returns The result of the exercise command.
 */
export const claimVestedTokens = async (token: string, contractId: string) => {
  return fetchFromLedger('v1/exercise', token, {
    templateId: `${VESTING_MODULE}:VestingGrant`,
    contractId,
    choice: 'Claim',
    argument: {
      claimTime: new Date().toISOString(),
    },
  });
};

/**
 * Exercises the `Revoke` choice on a `VestingGrant` contract.
 * This is performed by the issuer if the grant is revocable.
 * @param token - The authentication token for the JSON API.
 * @param contractId - The contract ID of the `VestingGrant` to revoke.
 * @param reason - The reason for revoking the grant.
 * @returns The result of the exercise command.
 */
export const revokeGrant = async (token: string, contractId: string, reason: string) => {
  return fetchFromLedger('v1/exercise', token, {
    templateId: `${VESTING_MODULE}:VestingGrant`,
    contractId,
    choice: 'Revoke',
    argument: {
      revocationTime: new Date().toISOString(),
      reason,
    },
  });
};


/**
 * Exercises the `Accelerate` choice on a `VestingGrant` contract.
 * This is performed by the admin upon a liquidity event.
 * @param token - The authentication token for the JSON API.
 * @param contractId - The contract ID of the `VestingGrant` to accelerate.
 * @returns The result of the exercise command.
 */
export const accelerateVesting = async (token: string, contractId: string) => {
    return fetchFromLedger('v1/exercise', token, {
      templateId: `${VESTING_MODULE}:VestingGrant`,
      contractId,
      choice: 'Accelerate',
      argument: {
        eventTime: new Date().toISOString(),
      },
    });
  };