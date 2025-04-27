import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals, assertObjectMatch } from 'https://deno.land/std@0.159.0/testing/asserts.ts';

// Test Suite for Custom Token Contract

// Constants for error codes
const ERROR_UNAUTHORIZED = 1001;
const ERROR_INSUFFICIENT_BALANCE = 1002;
const ERROR_INVALID_AMOUNT = 1003;
const ERROR_CONTRACT_PAUSED = 1004;

Clarinet.test({
  name: "Role Management: Contract owner can set roles",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // Set minter role for wallet_1
    let block = chain.mineBlock([
      Tx.contractCall('custom-token', 'set-role', 
        [types.ascii('minter'), types.principal(wallet1.address), types.bool(true)], 
        deployer.address
      )
    ]);

    // Check role was set successfully
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "Role Management: Unauthorized role changes are rejected",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    // Try to set role without being contract owner
    let block = chain.mineBlock([
      Tx.contractCall('custom-token', 'set-role', 
        [types.ascii('minter'), types.principal(wallet2.address), types.bool(true)], 
        wallet1.address
      )
    ]);

    // Check unauthorized error is returned
    block.receipts[0].result.expectErr().expectUint(ERROR_UNAUTHORIZED);
  }
});

Clarinet.test({
  name: "Token Minting: Authorized minter can mint tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // First set wallet_1 as minter
    let setupBlock = chain.mineBlock([
      Tx.contractCall('custom-token', 'set-role', 
        [types.ascii('minter'), types.principal(wallet1.address), types.bool(true)], 
        deployer.address
      )
    ]);

    // Mint tokens
    let mintBlock = chain.mineBlock([
      Tx.contractCall('custom-token', 'mint', 
        [types.uint(100), types.principal(wallet1.address)], 
        wallet1.address
      )
    ]);

    // Check mint was successful
    mintBlock.receipts[0].result.expectOk().expectBool(true);

    // Verify balance
    let balance = chain.callReadOnlyFn('custom-token', 'get-balance', 
      [types.principal(wallet1.address)], 
      wallet1.address
    );
    balance.result.expectUint(100);

    // Verify total supply
    let totalSupply = chain.callReadOnlyFn('custom-token', 'get-total-supply', [], wallet1.address);
    totalSupply.result.expectUint(100);
  }
});

Clarinet.test({
  name: "Token Minting: Unauthorized minting is prevented",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;

    // Try to mint without minter role
    let block = chain.mineBlock([
      Tx.contractCall('custom-token', 'mint', 
        [types.uint(100), types.principal(wallet1.address)], 
        wallet1.address
      )
    ]);

    // Check unauthorized error is returned
    block.receipts[0].result.expectErr().expectUint(ERROR_UNAUTHORIZED);
  }
});

Clarinet.test({
  name: "Token Burning: Authorized burner can burn tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;

    // First set up wallet_1 with tokens and as burner
    let setupBlocks = chain.mineBlock([
      // Set burner role
      Tx.contractCall('custom-token', 'set-role', 
        [types.ascii('burner'), types.principal(wallet1.address), types.bool(true)], 
        deployer.address
      ),
      // Mint initial tokens
      Tx.contractCall('custom-token', 'set-role', 
        [types.ascii('minter'), types.principal(deployer.address), types.bool(true)], 
        deployer.address
      ),
      Tx.contractCall('custom-token', 'mint', 
        [types.uint(200), types.principal(wallet1.address)], 
        deployer.address
      )
    ]);

    // Burn tokens
    let burnBlock = chain.mineBlock([
      Tx.contractCall('custom-token', 'burn', 
        [types.uint(50)], 
        wallet1.address
      )
    ]);

    // Check burn was successful
    burnBlock.receipts[0].result.expectOk().expectBool(true);

    // Verify balance
    let balance = chain.callReadOnlyFn('custom-token', 'get-balance', 
      [types.principal(wallet1.address)], 
      wallet1.address
    );
    balance.result.expectUint(150);

    // Verify total supply
    let totalSupply = chain.callReadOnlyFn('custom-token', 'get-total-supply', [], wallet1.address);
    totalSupply.result.expectUint(150);
  }
});

Clarinet.test({
  name: "Token Burning: Unauthorized burning is prevented",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;

    // Try to burn without burner role
    let block = chain.mineBlock([
      Tx.contractCall('custom-token', 'burn', 
        [types.uint(50)], 
        wallet1.address
      )
    ]);

    // Check unauthorized error is returned
    block.receipts[0].result.expectErr().expectUint(ERROR_UNAUTHORIZED);
  }
});

Clarinet.test({
  name: "Token Transfer: Successful token transfer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    // First set up initial tokens
    let setupBlocks = chain.mineBlock([
      Tx.contractCall('custom-token', 'set-role', 
        [types.ascii('minter'), types.principal(deployer.address), types.bool(true)], 
        deployer.address
      ),
      Tx.contractCall('custom-token', 'mint', 
        [types.uint(200), types.principal(wallet1.address)], 
        deployer.address
      )
    ]);

    // Transfer tokens
    let transferBlock = chain.mineBlock([
      Tx.contractCall('custom-token', 'transfer', 
        [types.uint(50), types.principal(wallet2.address)], 
        wallet1.address
      )
    ]);

    // Check transfer was successful
    transferBlock.receipts[0].result.expectOk().expectBool(true);

    // Verify sender balance
    let senderBalance = chain.callReadOnlyFn('custom-token', 'get-balance', 
      [types.principal(wallet1.address)], 
      wallet1.address
    );
    senderBalance.result.expectUint(150);

    // Verify recipient balance
    let recipientBalance = chain.callReadOnlyFn('custom-token', 'get-balance', 
      [types.principal(wallet2.address)], 
      wallet1.address
    );
    recipientBalance.result.expectUint(50);
  }
});

Clarinet.test({
  name: "Token Transfer: Transfer with insufficient balance is prevented",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    // Try to transfer more tokens than balance
    let block = chain.mineBlock([
      Tx.contractCall('custom-token', 'transfer', 
        [types.uint(50), types.principal(wallet2.address)], 
        wallet1.address
      )
    ]);

    // Check insufficient balance error is returned
    block.receipts[0].result.expectErr().expectUint(ERROR_INSUFFICIENT_BALANCE);
  }
});

Clarinet.test({
  name: "Pause Mechanism: Contract can be paused and unpause",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;

    // Pause the contract
    let pauseBlock = chain.mineBlock([
      Tx.contractCall('custom-token', 'set-pause-status', 
        [types.bool(true)], 
        deployer.address
      )
    ]);

    // Check pause was successful
    pauseBlock.receipts[0].result.expectOk().expectBool(true);

    // Try to transfer (should fail)
    let transferBlock = chain.mineBlock([
      Tx.contractCall('custom-token', 'transfer', 
        [types.uint(10), types.principal(accounts.get('wallet_1')!.address)], 
        deployer.address
      )
    ]);

    // Check contract paused error
    transferBlock.receipts[0].result.expectErr().expectUint(ERROR_CONTRACT_PAUSED);
  }
});

Clarinet.test({
  name: "Metadata Functions: Check token metadata",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;

    // Check token name
    let nameResult = chain.callReadOnlyFn('custom-token', 'get-name', [], wallet1.address);
    nameResult.result.expectAscii('TokenCraft');

    // Check token symbol
    let symbolResult = chain.callReadOnlyFn('custom-token', 'get-symbol', [], wallet1.address);
    symbolResult.result.expectAscii('TCRAFT');

    // Check token decimals
    let decimalsResult = chain.callReadOnlyFn('custom-token', 'get-decimals', [], wallet1.address);
    decimalsResult.result.expectUint(8);
  }
});

Clarinet.test({
  name: "SIP-010 Trait: Transfer-fixed function works correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;

    // Set up initial tokens
    let setupBlocks = chain.mineBlock([
      Tx.contractCall('custom-token', 'set-role', 
        [types.ascii('minter'), types.principal(deployer.address), types.bool(true)], 
        deployer.address
      ),
      Tx.contractCall('custom-token', 'mint', 
        [types.uint(200), types.principal(wallet1.address)], 
        deployer.address
      )
    ]);

    // Use transfer-fixed 
    let transferBlock = chain.mineBlock([
      Tx.contractCall('custom-token', 'transfer-fixed', 
        [
          types.uint(50), 
          types.principal(wallet1.address), 
          types.principal(wallet2.address),
          types.some(types.buff(Buffer.from('test memo')))
        ], 
        wallet1.address
      )
    ]);

    // Check transfer was successful
    transferBlock.receipts[0].result.expectOk().expectBool(true);

    // Verify balances
    let wallet1Balance = chain.callReadOnlyFn('custom-token', 'get-balance', 
      [types.principal(wallet1.address)], 
      wallet1.address
    );
    wallet1Balance.result.expectUint(150);

    let wallet2Balance = chain.callReadOnlyFn('custom-token', 'get-balance', 
      [types.principal(wallet2.address)], 
      wallet1.address
    );
    wallet2Balance.result.expectUint(50);
  }
});