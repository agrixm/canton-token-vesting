# Canton Token Vesting

A Canton/Daml smart contract suite for managing token vesting schedules, typically used for team members, advisors, and investors. This project supports:

-   **Cliff Vesting:** A period after which the first tranche of tokens vests.
-   **Linear Vesting:** Tokens vest linearly over a defined period.
-   **Liquidity Event Vesting:** Accelerated vesting triggered by a liquidity event.
-   **Revocation:** Ability for the issuer to revoke unvested tokens under certain conditions.

## Features

-   **Daml Smart Contracts:**  Robust and auditable vesting logic implemented in Daml, ensuring secure and transparent token release.
-   **Canton Network Compatibility:** Designed to be deployed on the Canton Network, leveraging its privacy and scalability features.
-   **TypeScript Frontend:** A simple web interface allows issuers to manage vesting schedules and recipients to view their vesting status.
-   **JSON Ledger API:**  The frontend interacts with the Canton ledger using the JSON API, providing a straightforward integration point.

## Architecture

The project consists of the following key components:

1.  **Daml Contracts:** Defines the core vesting logic, including `VestingSchedule`, `VestedTokens`, and related contracts.
2.  **Daml Script Tests:** Contains comprehensive tests to validate the correctness of the Daml contracts.
3.  **TypeScript Frontend:** Provides a user interface for interacting with the vesting contracts.
4.  **Canton Network Configuration:**  Configuration files for deploying and running the application on a Canton network.

## Prerequisites

Before you begin, ensure you have the following installed:

-   [Daml SDK](https://docs.daml.com/getting-started/index.html) (version 3.1.0 or later)
-   [Node.js](https://nodejs.org/) (version 16 or later)
-   [npm](https://www.npmjs.com/) (or [yarn](https://yarnpkg.com/))
-   A running Canton network (or a sandbox environment for testing)

## Setup Instructions

Follow these steps to set up and run the project:

1.  **Clone the Repository:**

    ```bash
    git clone <repository-url>
    cd canton-token-vesting
    ```

2.  **Build the Daml Contracts:**

    ```bash
    daml build
    ```

3.  **Generate the DAR file:**

    ```bash
    daml codegen dar .
    ```

4.  **Start a Canton Sandbox (Optional for local testing):**

    If you don't have a Canton network, start a sandbox:

    ```bash
    daml sandbox .daml/dist/canton-token-vesting-0.1.0.dar
    ```

    Note the port the sandbox is running on (default is 6865).

5.  **Install Frontend Dependencies:**

    ```bash
    cd ui
    npm install
    ```

6.  **Configure Frontend:**

    Create a `.env` file in the `ui` directory with the following variables, adjusting the values to match your Canton setup:

    ```
    REACT_APP_LEDGER_URL=http://localhost:7575
    REACT_APP_PARTY=Issuer
    REACT_APP_TOKEN=your_jwt_token_here
    ```

    *Replace `your_jwt_token_here` with a valid JWT token for your Canton participant.*  You can generate a token using the Canton CLI or API. The `REACT_APP_PARTY` should correspond to a party you have rights for on the Canton Ledger.

7.  **Run the Frontend:**

    ```bash
    npm start
    ```

    The frontend will be accessible at `http://localhost:3000` (or the port specified by your environment).

## Daml Script Testing

To run the Daml script tests:

```bash
daml script
```

This will execute the tests defined in the `test` directory and verify the correctness of the contract logic.

## Deployment to a Canton Network

For deployment to a real Canton network, you'll need to configure your participant(s) and upload the DAR file. Refer to the Canton documentation for detailed deployment instructions.

## Contract Overview

-   **VestingSchedule:**  The main contract defining the vesting terms (cliff, vesting period, total tokens, etc.).
-   **VestedTokens:** Represents the vested tokens owned by a specific recipient.
-   **RevocationRequest:** A contract representing a request from the issuer to revoke unvested tokens.

## Contributing

Contributions are welcome! Please submit pull requests with clear descriptions of the changes.

## License

This project is licensed under the [MIT License](LICENSE).