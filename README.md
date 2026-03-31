# canton-token-vesting

This project implements token vesting smart contracts on the Canton Network using Daml. It supports cliff periods, linear vesting schedules, accelerated vesting upon liquidity events, and revocation by the token issuer. A TypeScript frontend is included for interacting with the contracts via the Canton JSON Ledger API.

## Overview

Token vesting is a crucial mechanism for aligning incentives between project teams, investors, and the broader community. This Daml implementation provides a robust and transparent solution for managing token vesting schedules within the Canton Network.

Key features include:

-   **Cliff Period:** Tokens remain locked until a specified date.
-   **Linear Vesting:** Tokens unlock linearly over a defined period after the cliff.
-   **Liquidity Event Acceleration:** Vesting can be accelerated upon certain events (e.g., acquisition).
-   **Revocation:** The issuer can revoke unvested tokens under certain conditions.
-   **TypeScript Frontend:** Provides a user interface for creating, viewing, and interacting with vesting contracts.

## Prerequisites

-   [Daml SDK](https://docs.daml.com/docs/getting-started/installation.html) (version 3.1.0)
-   [Node.js](https://nodejs.org/) (version 18 or higher)
-   [Canton](https://docs.canton.io/docs/) (with a running participant)

## Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd canton-token-vesting
    ```

2.  **Build the Daml project:**

    ```bash
    daml build
    ```

3.  **Create a DAR file:**

    ```bash
    daml build
    ```

4.  **Deploy the DAR file to your Canton participant:**

    Follow your Canton setup instructions for deploying a DAR file. This typically involves using the Canton console or API.

5.  **Configure the TypeScript frontend:**

    -   Navigate to the `ui` directory:

        ```bash
        cd ui
        ```

    -   Install dependencies:

        ```bash
        npm install
        ```

    -   Create a `.env` file in the `ui` directory with the following variables:

        ```
        REACT_APP_LEDGER_URL=http://localhost:7575
        REACT_APP_AUTH_TOKEN=<your_canton_jwt_token>
        REACT_APP_PARTY=<your_participant_party_name>
        ```

        Replace `<your_canton_jwt_token>` with a valid JWT token for your Canton participant. Replace `<your_participant_party_name>` with the party name you are using on the Canton network.  You can obtain the JWT token from your Canton participant's configuration or by using a tool like `canton identity jwt`.

6.  **Run the TypeScript frontend:**

    ```bash
    npm start
    ```

    This will start the frontend application, typically accessible at `http://localhost:3000`.

## Using the Contracts

The contracts define the following key functionalities:

-   **TokenVestingAgreement:**  The main contract representing the vesting agreement between the issuer and the beneficiary.  It includes the cliff date, vesting start date, vesting end date, total amount of tokens, tokens vested, and acceleration clauses.
-   **CreateTokenVesting:** Choice on a TokenIssuer contract to propose a new TokenVestingAgreement.
-   **AcceptTokenVesting:** Choice on the TokenVestingAgreement to accept the proposed agreement, creating the TokenVestingAgreement contract.
-   **VestedAmount:** Choice to calculate the amount of tokens vested as of the current date.
-   **RevokeTokens:** Choice for the token issuer to revoke unvested tokens under specific conditions.
-   **AccelerateVesting:** Choice to trigger accelerated vesting.

The TypeScript frontend provides a user-friendly interface for:

-   Creating new token vesting agreements.
-   Viewing existing vesting agreements.
-   Calculating vested amounts.
-   Exercising choices related to revocation and acceleration (depending on your Canton setup and permissions).

## Important Considerations

-   **Canton Network Configuration:**  Ensure your Canton network is properly configured with the necessary participants and permissions.
-   **Security:**  This is a demonstration project.  For production use, conduct a thorough security audit of the Daml code and the frontend application.  Pay close attention to access control and data validation.
-   **Error Handling:** The frontend provides basic error handling.  Enhance this for a production environment.
-   **Customization:**  The vesting logic and acceleration criteria can be customized to fit specific project requirements.
-   **Scalability:** Consider the scalability implications of deploying these contracts to a large Canton network.

## Contributing

Contributions are welcome! Please submit pull requests with clear descriptions of the changes.

## License

[MIT License](LICENSE)