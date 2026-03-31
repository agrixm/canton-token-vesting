# canton-token-vesting

A Daml smart contract suite for managing token vesting schedules on the Canton Network. This project facilitates team and investor token vesting with features like cliff periods, linear release schedules, accelerated vesting upon liquidity events, and revocation capabilities controlled by the token issuer.

## Features

- **Cliff Vesting:** Tokens are locked for an initial period (the "cliff") before vesting begins.
- **Linear Vesting:** Tokens vest linearly over a defined period after the cliff.
- **Liquidity Event Acceleration:** Vesting can be accelerated upon the occurrence of a predefined liquidity event (e.g., acquisition, IPO).
- **Revocation:** The token issuer can revoke unvested tokens under specified conditions.
- **Role-Based Access Control:** Clear separation of roles for the token issuer, vesting recipient, and potentially, an administrator.
- **Canton Network Compatibility:** Designed to operate seamlessly within the Canton Network, leveraging its privacy and interoperability features.
- **JSON Ledger API Frontend:** A basic TypeScript frontend interacts with the Canton ledger via the JSON API for easy testing and demonstration.

## Prerequisites

- [Daml SDK](https://daml.com/developer/docs/setup/index.html) (version 3.1.0)
- [Node.js](https://nodejs.org/) and npm (Node Package Manager)
- Canton running locally or accessible network

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd canton-token-vesting
   ```

2. **Build the Daml project:**

   ```bash
   daml build
   ```

3. **Generate the Daml ledger model:**

   ```bash
   daml codegen js .daml/dist/canton-token-vesting-0.1.0.dar --output frontend/src/generated
   ```
   This command generates TypeScript code from the Daml model, which is used by the frontend to interact with the ledger.

4. **Install frontend dependencies:**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Start the Canton ledger (if not already running):**

   Refer to the Canton documentation for instructions on setting up and running a Canton network.  Ensure you have the necessary participants and domain configurations.

6. **Deploy the DAR file to Canton:**

   Use the Canton CLI to upload and activate the DAR file on your Canton network.  This typically involves specifying the participant and domain.  Refer to Canton documentation for exact steps.

7. **Configure the frontend:**

   - Create a `.env` file in the `frontend` directory based on the `.env.example` file, setting the correct ledger API endpoint and access token.
   - Obtain a valid access token for your Canton participant.  This usually involves authenticating against the Canton identity provider.

8. **Start the frontend:**

   ```bash
   cd frontend
   npm start
   ```

   The frontend should now be accessible in your browser, typically at `http://localhost:3000`.

## Project Structure

- `daml/`: Contains the Daml smart contracts.
  - `TokenVesting.daml`: Core vesting logic.
  - `Types.daml`: Custom data types.
- `frontend/`: Contains the TypeScript frontend.
  - `src/`: Frontend source code.
  - `src/generated/`: Generated Daml ledger model.
  - `package.json`: Frontend dependencies.
- `daml.yaml`: Daml project configuration.
- `.gitignore`: Git ignore file.
- `README.md`: Project documentation.

## Using the Contracts

The `TokenVesting.daml` file contains the main contracts:

- `VestingSchedule`: Represents the overall vesting agreement.
- `VestingCliff`: Defines the cliff period.
- `VestingGrant`: Represents individual vesting grants.

The frontend provides a basic interface for creating vesting schedules, managing grants, and triggering liquidity events.  Refer to the contract code for detailed documentation on each contract and its choices.

## Contributing

Contributions are welcome! Please submit pull requests with detailed descriptions of the changes.

## License

[MIT License](LICENSE)