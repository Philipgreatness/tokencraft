# TokenCraft

A flexible platform for designing custom token ecosystems on the Stacks blockchain.

## Project Overview

TokenCraft is a Clarity smart contract project that provides a flexible and secure platform for building custom token ecosystems on the Stacks blockchain. The project aims to enable developers to create their own fungible tokens with a wide range of features and customizations.

Key features of the TokenCraft project include:

- SIP-010 compatible token implementation
- Role-based access control for administrative functions
- Pausable contract functionality
- Comprehensive token metadata support
- Extensive test coverage for all core functionality

## Contract Architecture

The TokenCraft project consists of a single contract, `/workspace/contracts/custom-token.clar`, which implements the core functionality of the custom token.

### Data Structures

The contract maintains the following key data structures:

1. **Contract Owner**: The contract owner is stored in the `contract-owner` data variable and is used to control access to administrative functions.
2. **Error Codes**: The contract defines several error codes, such as `ERR_UNAUTHORIZED`, `ERR_INSUFFICIENT_BALANCE`, `ERR_INVALID_AMOUNT`, and `ERR_CONTRACT_PAUSED`, to handle various failure scenarios.
3. **Token Metadata**: The token name, symbol, and decimal places are stored in the `token-name`, `token-symbol`, and `token-decimals` data variables, respectively.
4. **Roles and Permissions**: The `roles` map is used to store role-based permissions, such as the `minter` and `burner` roles.
5. **Pausing Mechanism**: The `contract-paused` data variable is used to track the contract's paused state.
6. **Token Balances**: The `balances` map is used to store the token balances for each principal.
7. **Total Supply**: The `total-supply` data variable tracks the total supply of tokens.

### Key Functions

The contract provides the following key public functions:

1. **Set Role**: Allows the contract owner to set or revoke role-based permissions.
2. **Set Pause Status**: Allows the contract owner to pause or unpause the contract.
3. **Mint**: Allows authorized minters to mint new tokens.
4. **Burn**: Allows authorized burners to burn existing tokens.
5. **Transfer**: Allows users to transfer tokens between accounts.
6. **Read-Only Metadata Functions**: Provides functions to retrieve the token name, symbol, decimal places, individual balances, and total supply.
7. **SIP-010 Transfer-Fixed**: Provides a function that adheres to the SIP-010 token standard for token transfers.

The contract includes extensive authorization checks and input validations to ensure the security and integrity of the token ecosystem.

## Installation & Setup

To use the TokenCraft contract, you'll need to have Clarinet installed. Clarinet is a development environment and testing framework for Clarity smart contracts.

1. Install Clarinet: Follow the instructions on the [Clarinet GitHub repository](https://github.com/hirosystems/clarinet) to install Clarinet on your system.
2. Clone the TokenCraft repository: `git clone https://github.com/your-username/tokencraft.git`
3. Navigate to the project directory: `cd tokencraft`
4. Run Clarinet to start the development environment: `clarinet develop`

## Usage Guide

### Minting Tokens
To mint new tokens, an authorized minter can call the `mint` function:

```clarity
(mint 100 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.wallet-1)
```

This will mint 100 tokens and assign them to the `'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.wallet-1` principal.

### Burning Tokens
To burn existing tokens, an authorized burner can call the `burn` function:

```clarity
(burn 50)
```

This will burn 50 tokens from the caller's account.

### Transferring Tokens
To transfer tokens between accounts, users can call the `transfer` function:

```clarity
(transfer 25 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.wallet-2)
```

This will transfer 25 tokens from the caller's account to the `'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.wallet-2` principal.

## Testing

The TokenCraft project includes a comprehensive test suite located in the `/workspace/tests/custom_token_test.ts` file. The test suite covers the following key functionality:

- Role management (setting and revoking minter and burner roles)
- Token minting and burning, with authorization checks
- Token transfers, including handling of insufficient balances
- Pausing and unpausing the contract
- Retrieval of token metadata (name, symbol, decimals)
- Adherence to the SIP-010 token standard

To run the tests, execute the following command in the project directory:

```
clarinet test
```

The test suite ensures that the TokenCraft contract maintains the expected behavior and security properties.

## Security Considerations

The TokenCraft contract includes several security-focused features:

1. **Role-based Access Control**: The contract uses a roles map to control which principals can perform administrative functions like minting, burning, and pausing the contract.
2. **Input Validation**: The contract thoroughly validates all function inputs, such as ensuring minting and burning amounts are greater than zero, and that transfers do not exceed the sender's balance.
3. **Pausability**: The contract can be paused and unpaused by the contract owner, allowing for emergency response to potential issues.
4. **Error Handling**: The contract defines specific error codes to provide informative feedback on failed operations.
5. **SIP-010 Compliance**: The contract includes a `transfer-fixed` function that adheres to the SIP-010 token standard, ensuring compatibility with other Stacks applications.

These security features help to ensure the integrity and reliability of the TokenCraft token ecosystem.
