# Canton Token Vesting

A Daml smart contract suite for managing token vesting schedules for teams, advisors, and investors on the Canton Network. This project provides a robust, auditable, and automated solution for handling cliffs, linear vesting, revocations, and accelerated vesting upon liquidity events.

It includes:
1.  **Daml Contracts**: The core logic for vesting grants, schedules, and events.
2.  **Daml Scripts**: Initialization and testing scripts for the contracts.
3.  **TypeScript Frontend**: A lightweight React-based UI for interacting with the ledger via the Canton JSON API.

## Features

-   **Customizable Vesting Schedules**: Define vesting schedules with arbitrary start dates, durations, and total token amounts.
-   **Cliff Periods**: Enforce a cliff period before any tokens begin to vest.
-   **Linear Vesting**: Tokens vest linearly (e.g., monthly) after the cliff period.
-   **Grantee Claims**: Grantees can claim their vested tokens at any time. The contract calculates the vested amount based on the current time.
-   **Revocable Grants**: Issuers can create grants that they can revoke, clawing back any unvested tokens.
-   **Accelerated Vesting**: Define triggers (e.g., a liquidity event like an IPO or acquisition) that cause a portion or all of the remaining unvested tokens to vest immediately.
-   **On-Ledger Audit Trail**: Every action—grant creation, acceptance, claims, revocation—is immutably recorded on the Canton ledger, providing a perfect audit trail for all stakeholders.

## Project Structure

```
.
├── daml/
│   ├── Daml/Vesting/
│   │   ├── Grant.daml         # Core vesting grant templates
│   │   ├── Schedule.daml      # Data types for vesting schedules
│   │   └── Event.daml         # Liquidity event template for acceleration
│   └── test/
│       └── VestingTest.daml   # Daml Script tests for the vesting logic
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main React component
│   │   ├── ledgerClient.ts    # Low-level JSON API client
│   │   └── vestingService.ts  # High-level service for vesting operations
│   └── package.json
├── .gitignore
├── daml.yaml                  # Daml project configuration
└── README.md
```

## Prerequisites

-   [Daml SDK v3.1.0](https://docs.daml.com/getting-started/installation.html)
-   [Node.js v18.x or later](https://nodejs.org/) and npm
-   A running Canton ledger (e.g., using `daml start`) or Canton Community Edition.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/canton-token-vesting.git
cd canton-token-vesting
```

### 2. Run the Daml Backend

The easiest way to get a local Canton ledger instance running is with the `daml start` command.

1.  **Build the Daml Artifacts:**
    This command compiles your Daml code into a DAR (Daml Archive) file.

    ```bash
    daml build
    ```

2.  **Start the Canton Sandbox and JSON API:**
    This command starts a local Canton ledger, uploads the DAR file, and exposes the JSON API on port `7575`.

    ```bash
    daml start
    ```

    Keep this process running in a terminal window.

3.  **Run Tests (Optional):**
    Open a new terminal and run the Daml Script tests to verify the contract logic.

    ```bash
    daml test
    ```

4.  **Run Initialization Script (Optional):**
    The `daml.yaml` file is configured to run `Daml.Script.setup` when `daml start` is executed. This script allocates sample parties (Issuer, Alice, Bob) and creates a sample `VestingGrant` on the ledger. You can also run it manually:

    ```bash
    daml script --dar .daml/dist/canton-token-vesting-0.1.0.dar --script-name VestingTest:setup --ledger-host localhost --ledger-port 6865
    ```

### 3. Run the TypeScript Frontend

The frontend interacts with the JSON API started in the previous step.

1.  **Navigate to the frontend directory:**

    ```bash
    cd frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create a `.env` file:**
    The frontend needs to know where the JSON API is and how to authenticate. Create a `.env` file in the `frontend` directory with the following content.

    **Note:** The JWT tokens below are for the default parties created by `daml start` or the setup script. For a real environment, you would generate secure tokens. You can find the party IDs allocated by `daml start` in its console output.

    ```env
    # .env

    # The URL of the Canton JSON API
    REACT_APP_LEDGER_URL=http://localhost:7575

    # JWTs for authenticating as specific parties
    # These tokens have no expiration and are for local development ONLY.
    # The payload for each is: {"https://daml.com/ledger-api": {"ledgerId": "sandbox", "applicationId": "foobar", "actAs": ["<PartyId>"]}}

    # Replace with the Party ID for the Issuer
    REACT_APP_ISSUER_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2RhbWwuY29tL2xlZGdlci1hcGkiOnsibGVkZ2VySWQiOiJzYW5kYm94IiwiYXBwbGljYXRpb25JZCI6ImZvb2JhciIsImFjdEFzIjpbIklzc3VlciJdfX0.p4HhD02z0jBw5_ap252tSdtYd9MRY4aY9iX5uLS2SNo

    # Replace with the Party ID for Alice (grantee)
    REACT_APP_ALICE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2RhbWwuY29tL2xlZGdlci1hcGkiOnsibGVkZ2VySWQiOiJzYW5kYm94IiwiYXBwbGljYXRpb25JZCI6ImZvb2JhciIsImFjdEFzIjpbIkFsaWNlIl19fQ.f6k6mJ3302iF6sVTgDkIqmqII1QG4nOqW5LLvXgQzO4
    ```

4.  **Start the frontend application:**

    ```bash
    npm start
    ```

    The application will be available at `http://localhost:3000`. You can now use the UI to view and interact with vesting contracts on the ledger.

## Daml Model Overview

-   **`Grant.daml`**: Contains the main templates.
    -   `VestingGrantProposal`: An offer from an `issuer` to a `grantee` to enter into a vesting agreement. The `grantee` must accept it.
    -   `VestingGrant`: The active, non-revocable vesting agreement. It holds the schedule and allows the `grantee` to claim vested tokens.
    -   `RevocableVestingGrant`: The active, revocable vesting agreement. It includes a `RevokeGrant` choice for the `issuer`.
-   **`Schedule.daml`**: Contains the data types that define the vesting mechanics.
    -   `VestingSchedule`: The core data type containing the start date, total amount, cliff details, and total duration.
    -   `Cliff`: A data type specifying the cliff end date and the amount of tokens that vest at that moment.
-   **`Event.daml`**:
    -   `LiquidityEvent`: A contract that can be created by the `issuer` to signal a major company event (e.g., IPO). `VestingGrant` contracts observe this and can trigger accelerated vesting.

## Workflow Walkthrough

1.  **Grant Creation**: An `Issuer` party creates a `VestingGrantProposal` contract with a `grantee` (e.g., `Alice`).
2.  **Acceptance**: `Alice` sees the proposal and exercises the `Accept` choice. This archives the proposal and creates a new `VestingGrant` (or `RevocableVestingGrant`) contract, with both `Issuer` and `Alice` as signatories.
3.  **Vesting**: As time passes, tokens vest according to the schedule defined in the grant.
4.  **Claiming**: `Alice` can, at any time, exercise the `ClaimVestedTokens` choice on her `VestingGrant` contract. The contract logic calculates the vested amount based on the current ledger time, updates the grant's state, and returns the newly claimed token amount.
5.  **Revocation (Optional)**: If the grant is a `RevocableVestingGrant`, the `Issuer` can exercise the `RevokeGrant` choice at any time. This archives the grant, preventing any future claims.
6.  **Acceleration (Optional)**: The `Issuer` creates a `LiquidityEvent` contract. `Alice` sees this event and can exercise the `ClaimAcceleratedTokens` choice on her grant to claim the tokens that vested early as a result of the event.