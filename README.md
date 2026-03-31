# Canton Token Vesting

This project provides a suite of Daml smart contracts for managing token vesting schedules on the Canton network. It's designed for team members, investors, and other parties who receive tokens with vesting conditions.

## Features

*   **Cliff Period:** Define an initial waiting period before vesting begins.
*   **Linear Vesting:** Tokens are released gradually over a defined period after the cliff.
*   **Liquidity Event Acceleration:** Trigger accelerated vesting based on predefined conditions (e.g., acquisition, IPO).
*   **Revocation:** The token issuer can revoke unvested tokens under specific circumstances.
*   **Role-Based Access:** Clear separation of roles for token issuer and recipient.
*   **Canton Network Compatibility:** Designed to run on a distributed ledger using the Canton network.
*   **TypeScript Frontend:** A simple UI for interacting with the contracts via the Canton JSON API.

## Architecture

The project consists of the following main components:

*   **Daml Smart Contracts:** Defines the logic for token vesting, including cliff periods, linear vesting, acceleration, and revocation. Key contracts include `VestingSchedule`, `VestingGrant`, and potentially role-based contracts for issuer and recipient.
*   **Daml Model:** Contains the Daml code defining the contract templates and choices. Located in the `daml` directory.
*   **Frontend (TypeScript):** A user interface built with TypeScript that allows users to:
    *   View vesting schedules.
    *   Claim vested tokens.
    *   (For issuers) Revoke unvested tokens or trigger liquidity event acceleration.
    *   Interacts with the Canton JSON API to create, exercise, and query contracts.
*   **Canton Network:** The distributed ledger technology that executes the Daml smart contracts.
*   **daml.yaml:** The project's Daml package definition.
*   **.gitignore:** Specifies intentionally untracked files that Git should ignore.
*   **README.md:** This file, providing an overview of the project and setup instructions.

## Prerequisites

*   **Daml SDK (3.1.0):**  Install the Daml SDK.  See [https://docs.daml.com/getting-started/index.html](https://docs.daml.com/getting-started/index.html).  Verify the installation with `daml --version`.
*   **Node.js and npm:**  Required for the frontend.
*   **Canton Network:** A running Canton network instance.  Refer to Canton documentation for setup instructions.  Ensure the JSON API is enabled.

## Setup Instructions

1.  **Clone the Repository:**

    ```bash
    git clone <repository_url>
    cd canton-token-vesting
    ```

2.  **Build the Daml Model:**

    ```bash
    daml build
    ```

3.  **Start the Daml Ledger:**

    You will likely interact with the Canton Ledger via the JSON API. Ensure the Canton Ledger and the JSON API are running and accessible.  Typically this runs at `http://localhost:7575`.

4.  **Frontend Setup:**

    ```bash
    cd ui
    npm install
    npm start
    ```

    This will install the necessary dependencies and start the development server.  The frontend should be accessible at `http://localhost:3000` (or a similar port).

5.  **Configure the Frontend:**

    The frontend needs to be configured to point to your Canton JSON API endpoint.  You will likely need to edit environment variables or a configuration file in the `ui` directory to set the correct API URL (e.g., `http://localhost:7575`).  Also configure the authentication token.

## Running the Application

1.  **Start the Canton Network:** Follow the Canton documentation to start your Canton network.
2.  **Deploy the Daml Package:** Use the Canton tools to upload the compiled Daml package (`.dar` file) to your Canton network.
3.  **Start the Frontend:**  As described in the Setup Instructions.
4.  **Interact with the Contracts:** Use the frontend to create vesting schedules, claim tokens, and (if authorized) perform actions like revocation or triggering liquidity events.

## Testing

*   **Daml Unit Tests:** The `daml` directory should contain unit tests for the Daml contracts.  Run them using:

    ```bash
    daml test
    ```

*   **Frontend Tests:** The `ui` directory may contain frontend tests (e.g., using Jest or Cypress).  Refer to the frontend's `README.md` or documentation for instructions on running these tests.

## Configuration

*   **Canton Network:**  Refer to the Canton documentation for configuring the network, including participant setup, domain configuration, and security settings.
*   **JSON API:**  Configure the JSON API endpoint, authentication, and CORS settings.
*   **Frontend:**  Configure the frontend to point to the correct JSON API endpoint and authentication credentials.

## Troubleshooting

*   **Daml SDK Issues:**  Check the Daml SDK documentation for troubleshooting common issues.
*   **Canton Network Issues:**  Refer to the Canton documentation for troubleshooting network-related problems.
*   **JSON API Errors:**  Inspect the JSON API logs for error messages and consult the Canton documentation for API usage.
*   **Frontend Errors:**  Check the browser console for JavaScript errors and the frontend's build process for any compilation issues.

## Contributing

Please submit pull requests with proposed changes.  Ensure that your code is well-documented and includes unit tests.

## License

[MIT License]