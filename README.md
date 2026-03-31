# Canton Token Vesting

This project provides a suite of Daml smart contracts for managing token vesting schedules on the Canton Network. It supports:

- **Cliff periods:** Tokens are locked for an initial period.
- **Linear vesting:** Tokens are released linearly over a specified duration.
- **Liquidity event acceleration:** Vesting can be accelerated upon a liquidity event.
- **Revocation:** The issuer can revoke unvested tokens.

A lightweight TypeScript frontend is included to interact with the Canton JSON Ledger API.

## Getting Started

### Prerequisites

-   Daml SDK (version 3.1.0)
-   Node.js and npm

### Setup

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd canton-token-vesting
    ```

2.  **Install Daml dependencies:**

    ```bash
    daml build
    ```

3.  **Install TypeScript frontend dependencies:**

    ```bash
    cd ui
    npm install
    cd ..
    ```

4.  **Start the Daml ledger:**

    This requires a running Canton network.  Refer to Canton documentation for network setup. For local testing, you can use the sandbox:

    ```bash
    daml ledger sandbox --ledgerid vesting-sandbox
    ```

5.  **Generate a JWT Token**

    You'll need a valid JWT token to interact with the ledger.  Consult Canton documentation for authentication setup. Ensure your party has appropriate rights.

    Example command (adjust party and ledger-id to match your Canton setup):
    ```bash
    daml ledger get-token --ledger-id vesting-sandbox --application-id vesting-app --party Alice --admin
    ```

    Copy the generated token.  You will need this for the next step.

6.  **Configure the Frontend:**

    Create a `.env` file in the `ui` directory with the following variables:

    ```
    REACT_APP_LEDGER_URL=http://localhost:7575
    REACT_APP_AUTH_TOKEN=<YOUR_JWT_TOKEN>
    REACT_APP_PARTY=Alice
    ```

    Replace `<YOUR_JWT_TOKEN>` with the token from the previous step.  Adjust the `REACT_APP_PARTY` to match a party on your Canton network.

7.  **Run the TypeScript frontend:**

    ```bash
    cd ui
    npm start
    ```

    This will start the frontend in your browser, typically at `http://localhost:3000`.

## Contracts

The Daml contracts are located in the `daml` directory. Key contracts include:

-   **VestingSchedule.daml:** Defines the core `VestingSchedule` contract, including cliff, vesting start, vesting end, and total tokens.
-   **LiquidityEvent.daml:** Defines the `LiquidityEvent` contract for triggering accelerated vesting.
-   **TokenVesting.daml:** Defines helper functions.

## Usage

The frontend allows you to:

-   **Create Vesting Schedules:** Specify parameters like cliff period, vesting duration, and token amounts.
-   **View Vesting Schedules:** Track the progress of vesting schedules.
-   **Exercise Choices:**  Execute actions like claiming vested tokens or triggering liquidity events.

## Contributing

Contributions are welcome! Please submit pull requests with clear descriptions of the changes.

## License

[Choose a License, e.g., Apache 2.0]