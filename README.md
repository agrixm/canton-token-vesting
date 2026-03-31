# Canton Token Vesting

This project implements a robust token vesting solution on the Canton Network using Daml smart contracts. It provides a flexible framework for managing token distributions to team members and investors, incorporating common vesting features such as cliff periods, linear release schedules, accelerated vesting on liquidity events, and issuer-controlled revocation. A lightweight TypeScript frontend interacts with the Canton JSON API to demonstrate the contract's functionality.

## Features

*   **Vesting Agreement**: Establishes a formal agreement between an issuer and a recipient for token vesting.
*   **Cliff Period**: Tokens begin vesting only after a specified initial period (the "cliff").
*   **Linear Vesting Schedule**: Tokens are released linearly over a defined vesting period after the cliff.
*   **Accelerated Vesting**: Supports immediate vesting of all remaining unvested tokens upon a specified liquidity event (e.g., acquisition, IPO).
*   **Revocation**: The issuing party can revoke the vesting agreement, forfeiting all unvested tokens.
*   **Token Claiming**: Recipients can claim vested tokens at any time after they become available.
*   **Auditability**: All actions and state changes are recorded on the Canton ledger, providing a transparent and auditable trail.

## Project Structure

The project is divided into two main parts:

*   **`daml/`**: Contains the Daml smart contract definitions.
    *   `daml.yaml`: Daml project configuration.
    *   `Daml.Vesting.daml`: Core vesting contract templates (`VestingAgreement`, `VestingSchedule`, etc.).
    *   `Daml.Vesting.Test.daml`: Unit tests for the Daml contracts.
    *   `Daml.Vesting.Script.daml`: Daml Script for setting up initial parties and demonstrating basic workflows.
*   **`ui-ts/`**: A TypeScript client application that interacts with the Canton JSON API.
    *   `package.json`: Node.js project configuration and dependencies.
    *   `src/index.ts`: Main application logic for interacting with the Daml ledger.
    *   `src/setup.ts`: Helper functions for party setup and initial contract creation.

## Prerequisites

Before running this project, you need to have the following installed:

1.  **Daml SDK (v3.1.0)**:
    ```bash
    curl -sSL https://get.daml.com/ | sh -s 3.1.0
    export PATH=$HOME/.daml/bin:$PATH # Add to your shell profile for persistence
    ```
2.  **Node.js & npm**:
    ```bash
    # Install Node.js (e.g., via nvm, or directly from nodejs.org)
    node -v
    npm -v
    ```
3.  **Canton Ledger**: A running Canton instance (e.g., `daml sandbox`).

## Setup and Running the Project

Follow these steps to set up and run the Daml contracts and the TypeScript client.

### 1. Start a Canton Ledger (Daml Sandbox)

Open a new terminal and start a Daml Sandbox instance. This will also start the JSON API server.

```bash
daml sandbox --json-api-port 7575
```

Keep this terminal open as long as you want the ledger to run. The JSON API will be accessible at `http://localhost:7575`.

### 2. Build and Deploy Daml Contracts

In a separate terminal, navigate to the project root and build the Daml contracts.

```bash
daml build
```

Then, deploy the `.dar` file to your running Canton Sandbox using the Daml assistant's `daml ledger upload-dar` command or by explicitly configuring the JSON API to load it. For this example, the TypeScript client will implicitly handle the initial DAR upload by virtue of how it interacts with the JSON API.

Alternatively, you can run the Daml script to initialize parties and some contracts:
```bash
daml script --input-file .daml/dist/canton-token-vesting-0.1.0.dar --script-name Daml.Vesting.Script:setupAndDemonstrate --ledger-host localhost --ledger-port 6865 --json-api-port 7575 --use-acs --output-file script-output.txt
```
(Note: The TypeScript client will perform its own setup, so this step is optional for demonstration, but useful for testing the script itself.)

### 3. Initialize and Run the TypeScript Client

In another terminal, navigate into the `ui-ts` directory, install dependencies, and then run the client.

```bash
cd ui-ts
npm install
npm start
```

The TypeScript client will:
1.  Connect to the JSON API at `http://localhost:7575`.
2.  Set up default parties (`Issuer`, `TeamMember1`, `Investor1`, `LiquidityProvider`).
3.  Create and demonstrate several vesting scenarios:
    *   A basic team member vesting with cliff and linear release.
    *   An investor vesting with a different schedule.
    *   Demonstrate claiming vested tokens.
    *   Demonstrate accelerated vesting on a liquidity event.
    *   Demonstrate revocation of an unvested agreement.
4.  Print the results and contract IDs to the console.

## Workflow Overview

The general workflow for token vesting using these contracts is as follows:

1.  **Party Setup**: The `Issuer` (e.g., the company or foundation issuing tokens) and `Recipient` (e.g., team member, investor) parties are created on the Canton ledger.
2.  **Proposal**: The `Issuer` proposes a `VestingProposal` contract to a `Recipient`, specifying the total token amount, vesting start date, cliff duration, vesting duration, and an optional `LiquidityProvider` for acceleration.
3.  **Acceptance**: The `Recipient` accepts the `VestingProposal`, creating a `VestingAgreement` contract. This contract signifies the binding agreement.
4.  **Token Issuance**: The `Issuer` issues the initial tokens associated with the `VestingAgreement`. These tokens are held in escrow, linked to the `VestingAgreement`.
5.  **Vesting Schedule**: Over time, based on the vesting start date, cliff, and linear schedule, tokens become `Vested`.
6.  **Claiming**: The `Recipient` can `ClaimVested` tokens at any point when they have become vested. This exercises a choice on the `VestingAgreement` to transfer the tokens to the recipient.
7.  **Acceleration**: If a `LiquidityEvent` occurs (declared by the `LiquidityProvider`), the `VestingAgreement` can be `Accelerated`, making all remaining unvested tokens immediately vested and claimable.
8.  **Revocation**: The `Issuer` can `RevokeVesting` if the agreement terms allow (e.g., employee departure), leading to the forfeiture of any unvested tokens.