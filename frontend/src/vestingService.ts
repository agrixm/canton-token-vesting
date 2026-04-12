import { ledgerClient, LedgerClient } from './ledgerClient';

// --- Constants ----------------------------------------------------------------

// NOTE: The template IDs are formatted as `<Module>:<Template>`.
// The JSON API can resolve these to the full package-specific IDs.
const VESTING_SCHEDULE_TEMPLATE_ID = 'Vesting:VestingSchedule';
const VESTING_ALLOCATION_TEMPLATE_ID = 'Vesting:VestingAllocation';

// --- Type Definitions ---------------------------------------------------------
// These types correspond to the Daml templates and data types in the model.

export type DamlDecimal = string;
export type DamlParty = string;
export type DamlDate = string; // YYYY-MM-DD
export type DamlTime = string; // ISO 8601 format
export type DamlContractId = string;

/**
 * Represents the identifier for a token, analogous to a CUSIP or ISIN.
 */
export interface TokenIdentifier {
  issuer: DamlParty;
  symbol: string;
  isFungible: boolean;
}

/**
 * The payload of the VestingSchedule contract.
 */
export interface VestingSchedulePayload {
  issuer: DamlParty;
  beneficiary: DamlParty;
  startDate: DamlDate;
  cliffDate: DamlDate;
  endDate: DamlDate;
  totalAmount: DamlDecimal;
  tokenIdentifier: TokenIdentifier;
  isRevocable: boolean;
  isAccelerated: boolean;
  revokedAt: DamlTime | null;
  acknowledged: boolean;
}

/**
 * A full VestingSchedule contract object as returned by the JSON API.
 */
export interface VestingSchedule {
  contractId: DamlContractId;
  templateId: string;
  payload: VestingSchedulePayload;
}

/**
 * The payload of the VestingAllocation contract.
 */
export interface VestingAllocationPayload {
  scheduleId: DamlContractId;
  issuer: DamlParty;
  beneficiary: DamlParty;
  vestedAmount: DamlDecimal;
  claimedAmount: DamlDecimal;
  tokenIdentifier: TokenIdentifier;
}

/**
 * A full VestingAllocation contract object as returned by the JSON API.
 */
export interface VestingAllocation {
  contractId: DamlContractId;
  templateId: string;
  payload: VestingAllocationPayload;
}

// --- VestingService Class -------------------------------------------------------

class VestingService {
  private client: LedgerClient;

  constructor(client: LedgerClient) {
    this.client = client;
  }

  /**
   * Fetches all `VestingSchedule` contracts visible to the current party.
   * @returns A promise that resolves to an array of VestingSchedule contracts.
   */
  public async getSchedules(): Promise<VestingSchedule[]> {
    return this.client.query<VestingSchedule>({
      templateIds: [VESTING_SCHEDULE_TEMPLATE_ID],
    });
  }

  /**
   * Fetches the unique `VestingAllocation` contract for a given schedule ID.
   * Assumes there is at most one allocation per schedule.
   * @param scheduleId The ContractId of the parent VestingSchedule.
   * @returns A promise that resolves to the VestingAllocation contract, or null if not found.
   */
  public async getAllocation(scheduleId: DamlContractId): Promise<VestingAllocation | null> {
    const allocations = await this.client.query<VestingAllocation>({
      templateIds: [VESTING_ALLOCATION_TEMPLATE_ID],
      query: {
        scheduleId: scheduleId,
      },
    });
    return allocations.length > 0 ? allocations[0] : null;
  }

  /**
   * Exercises the `Acknowledge` choice on a `VestingSchedule` contract.
   * This is called by the beneficiary to accept the vesting terms.
   * @param contractId The ContractId of the VestingSchedule to acknowledge.
   * @returns A promise that resolves on successful exercise of the choice.
   */
  public async acknowledge(contractId: DamlContractId): Promise<unknown> {
    return this.client.exerciseChoice({
      templateId: VESTING_SCHEDULE_TEMPLATE_ID,
      contractId,
      choice: 'Acknowledge',
      argument: {},
    });
  }

  /**
   * Exercises the `Claim` choice on a `VestingAllocation` contract.
   * This is called by the beneficiary to withdraw vested tokens.
   * @param contractId The ContractId of the VestingAllocation to claim from.
   * @returns A promise that resolves on successful exercise of the choice.
   */
  public async claim(contractId: DamlContractId): Promise<unknown> {
    return this.client.exerciseChoice({
      templateId: VESTING_ALLOCATION_TEMPLATE_ID,
      contractId,
      choice: 'Claim',
      argument: {},
    });
  }

  /**
   * Exercises the `Revoke` choice on a `VestingSchedule` contract.
   * This is called by the issuer to cancel the vesting schedule.
   * @param contractId The ContractId of the VestingSchedule to revoke.
   * @returns A promise that resolves on successful exercise of the choice.
   */
  public async revoke(contractId: DamlContractId): Promise<unknown> {
    return this.client.exerciseChoice({
      templateId: VESTING_SCHEDULE_TEMPLATE_ID,
      contractId,
      choice: 'Revoke',
      argument: {},
    });
  }

  /**
   * Exercises the `Accelerate` choice on a `VestingSchedule` contract.
   * This is called by the issuer to cause all remaining tokens to vest immediately.
   * @param contractId The ContractId of the VestingSchedule to accelerate.
   * @param accelerationDate The date on which the acceleration event occurred.
   * @returns A promise that resolves on successful exercise of the choice.
   */
  public async accelerate(contractId: DamlContractId, accelerationDate: DamlDate): Promise<unknown> {
    return this.client.exerciseChoice({
      templateId: VESTING_SCHEDULE_TEMPLATE_ID,
      contractId,
      choice: 'Accelerate',
      argument: {
        accelerationDate,
      },
    });
  }
}

/**
 * A singleton instance of the VestingService.
 * This is used throughout the application to interact with the ledger.
 */
export const vestingService = new VestingService(ledgerClient);