
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Test 1: Protocol Initialization
Clarinet.test({
    name: "Protocol can be initialized by contract owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const treasury = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'initialize',
                [types.principal(treasury.address)],
                deployer.address
            ),
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), true);
        
        // Verify protocol parameters
        let paramsBlock = chain.callReadOnlyFn(
            'lending-protocol-contract',
            'get-protocol-params',
            [],
            deployer.address
        );
        
        const params = paramsBlock.result.expectOk().expectTuple();
        assertEquals(params['protocol-fee'], types.uint(200));
        assertEquals(params['liquidation-threshold'], types.uint(8000));
        assertEquals(params['treasury'], types.principal(treasury.address));
    },
});

// Test 2: NFT Collection Registration
Clarinet.test({
    name: "NFT collections can be registered by owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const treasury = accounts.get('wallet_1')!;
        const nftContract = accounts.get('wallet_2')!;
        
        // Initialize protocol first
        let initBlock = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'initialize',
                [types.principal(treasury.address)],
                deployer.address
            ),
        ]);
        
        assertEquals(initBlock.receipts[0].result.expectOk(), true);
        
        // Register collection
        let block = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'register-collection',
                [
                    types.ascii('BORED_APES'),
                    types.principal(nftContract.address),
                    types.utf8('https://api.boredapes.com/'),
                    types.uint(5000), // 50% max LTV
                    types.uint(500),  // 5% min interest
                    types.uint(2000), // 20% max interest
                    types.ascii('linear'),
                    types.list([types.ascii('Common'), types.ascii('Rare'), types.ascii('Legendary')]),
                    types.uint(1000000), // 10 STX min value
                    types.uint(100000000), // 1000 STX max value
                ],
                deployer.address
            ),
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), true);
        
        // Verify collection was registered
        let collectionBlock = chain.callReadOnlyFn(
            'lending-protocol-contract',
            'get-collection',
            [types.ascii('BORED_APES')],
            deployer.address
        );
        
        const collection = collectionBlock.result.expectSome().expectTuple();
        assertEquals(collection['max-ltv'], types.uint(5000));
        assertEquals(collection['enabled'], types.bool(true));
    },
});

// Test 3: Appraiser Authorization and NFT Appraisal
Clarinet.test({
    name: "Appraisers can be authorized and submit appraisals",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const treasury = accounts.get('wallet_1')!;
        const nftContract = accounts.get('wallet_2')!;
        const appraiser1 = accounts.get('wallet_3')!;
        const appraiser2 = accounts.get('wallet_4')!;
        const appraiser3 = accounts.get('wallet_5')!;
        const borrower = accounts.get('wallet_6')!;
        
        // Initialize protocol
        let initBlock = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'initialize',
                [types.principal(treasury.address)],
                deployer.address
            ),
        ]);
        
        // Register collection
        let regBlock = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'register-collection',
                [
                    types.ascii('BORED_APES'),
                    types.principal(nftContract.address),
                    types.utf8('https://api.boredapes.com/'),
                    types.uint(5000),
                    types.uint(500),
                    types.uint(2000),
                    types.ascii('linear'),
                    types.list([types.ascii('Common'), types.ascii('Rare')]),
                    types.uint(1000000),
                    types.uint(100000000),
                ],
                deployer.address
            ),
        ]);
        
        // Authorize appraisers
        let authBlock = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'authorize-appraiser',
                [
                    types.principal(appraiser1.address),
                    types.list([types.ascii('BORED_APES')])
                ],
                deployer.address
            ),
            Tx.contractCall(
                'lending-protocol-contract',
                'authorize-appraiser',
                [
                    types.principal(appraiser2.address),
                    types.list([types.ascii('BORED_APES')])
                ],
                deployer.address
            ),
            Tx.contractCall(
                'lending-protocol-contract',
                'authorize-appraiser',
                [
                    types.principal(appraiser3.address),
                    types.list([types.ascii('BORED_APES')])
                ],
                deployer.address
            ),
        ]);
        
        assertEquals(authBlock.receipts.length, 3);
        authBlock.receipts.forEach(receipt => {
            assertEquals(receipt.result.expectOk(), true);
        });
        
        // Request appraisal
        let requestBlock = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'request-appraisal',
                [
                    types.ascii('BORED_APES'),
                    types.uint(1)
                ],
                borrower.address
            ),
        ]);
        
        assertEquals(requestBlock.receipts[0].result.expectOk(), types.uint(1));
        
        // Submit appraisals from 3 oracles
        let appraisalBlock = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'submit-appraisal',
                [
                    types.uint(1),
                    types.uint(50000000) // 500 STX
                ],
                appraiser1.address
            ),
            Tx.contractCall(
                'lending-protocol-contract',
                'submit-appraisal',
                [
                    types.uint(1),
                    types.uint(55000000) // 550 STX
                ],
                appraiser2.address
            ),
            Tx.contractCall(
                'lending-protocol-contract',
                'submit-appraisal',
                [
                    types.uint(1),
                    types.uint(60000000) // 600 STX
                ],
                appraiser3.address
            ),
        ]);
        
        assertEquals(appraisalBlock.receipts.length, 3);
        
        // The third appraisal should finalize the process
        const finalResult = appraisalBlock.receipts[2].result.expectOk().expectTuple();
        assertEquals(finalResult['collection-id'], types.ascii('BORED_APES'));
        assertEquals(finalResult['token-id'], types.uint(1));
        assertEquals(finalResult['value'], types.uint(55000000)); // Median of 50M, 55M, 60M = 55M
        
        // Verify NFT asset was created
        let assetBlock = chain.callReadOnlyFn(
            'lending-protocol-contract',
            'get-nft-asset',
            [types.ascii('BORED_APES'), types.uint(1)],
            borrower.address
        );
        
        const asset = assetBlock.result.expectSome().expectTuple();
        assertEquals(asset['current-appraisal'], types.uint(55000000));
        assertEquals(asset['collection-id'], types.ascii('BORED_APES'));
    },
});

// Test 4: Loan Application and Management
Clarinet.test({
    name: "Borrowers can apply for loans against appraised NFTs",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const treasury = accounts.get('wallet_1')!;
        const nftContract = accounts.get('wallet_2')!;
        const appraiser1 = accounts.get('wallet_3')!;
        const appraiser2 = accounts.get('wallet_4')!;
        const appraiser3 = accounts.get('wallet_5')!;
        const borrower = accounts.get('wallet_6')!;
        
        // Setup: Initialize, register collection, authorize appraisers
        let setupBlock = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'initialize',
                [types.principal(treasury.address)],
                deployer.address
            ),
            Tx.contractCall(
                'lending-protocol-contract',
                'register-collection',
                [
                    types.ascii('BORED_APES'),
                    types.principal(nftContract.address),
                    types.utf8('https://api.boredapes.com/'),
                    types.uint(5000), // 50% max LTV
                    types.uint(500),
                    types.uint(2000),
                    types.ascii('linear'),
                    types.list([types.ascii('Common'), types.ascii('Rare')]),
                    types.uint(1000000),
                    types.uint(100000000),
                ],
                deployer.address
            ),
            Tx.contractCall(
                'lending-protocol-contract',
                'authorize-appraiser',
                [types.principal(appraiser1.address), types.list([types.ascii('BORED_APES')])],
                deployer.address
            ),
            Tx.contractCall(
                'lending-protocol-contract',
                'authorize-appraiser',
                [types.principal(appraiser2.address), types.list([types.ascii('BORED_APES')])],
                deployer.address
            ),
            Tx.contractCall(
                'lending-protocol-contract',
                'authorize-appraiser',
                [types.principal(appraiser3.address), types.list([types.ascii('BORED_APES')])],
                deployer.address
            ),
        ]);
        
        // Request and complete appraisal
        let appraisalSetup = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'request-appraisal',
                [types.ascii('BORED_APES'), types.uint(1)],
                borrower.address
            ),
        ]);
        
        let appraisalSubmit = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'submit-appraisal',
                [types.uint(1), types.uint(50000000)],
                appraiser1.address
            ),
            Tx.contractCall(
                'lending-protocol-contract',
                'submit-appraisal',
                [types.uint(1), types.uint(55000000)],
                appraiser2.address
            ),
            Tx.contractCall(
                'lending-protocol-contract',
                'submit-appraisal',
                [types.uint(1), types.uint(60000000)],
                appraiser3.address
            ),
        ]);
        
        // Apply for loan - 25M STX against 55M STX collateral (45% LTV)
        let loanBlock = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'apply-for-loan',
                [
                    types.ascii('BORED_APES'),
                    types.uint(1),
                    types.uint(25000000), // 250 STX loan
                    types.uint(1440) // 10 days duration
                ],
                borrower.address
            ),
        ]);
        
        assertEquals(loanBlock.receipts.length, 1);
        assertEquals(loanBlock.receipts[0].result.expectOk(), types.uint(1)); // Loan ID = 1
        
        // Verify loan was created correctly
        let loanQuery = chain.callReadOnlyFn(
            'lending-protocol-contract',
            'get-loan',
            [types.uint(1)],
            borrower.address
        );
        
        const loan = loanQuery.result.expectSome().expectTuple();
        assertEquals(loan['borrower'], types.principal(borrower.address));
        assertEquals(loan['loan-amount'], types.uint(25000000));
        assertEquals(loan['collection-id'], types.ascii('BORED_APES'));
        assertEquals(loan['token-id'], types.uint(1));
        assertEquals(loan['state'], types.uint(0)); // Active
        
        // Verify borrower history was updated
        let historyQuery = chain.callReadOnlyFn(
            'lending-protocol-contract',
            'get-borrower-history',
            [types.principal(borrower.address)],
            borrower.address
        );
        
        const history = historyQuery.result.expectSome().expectTuple();
        assertEquals(history['total-loans'], types.uint(1));
        assertEquals(history['active-loans'], types.uint(1));
        assertEquals(history['total-borrowed'], types.uint(25000000));
    },
});

// Test 5: Loan Repayment
Clarinet.test({
    name: "Borrowers can repay loans fully or partially",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const treasury = accounts.get('wallet_1')!;
        const nftContract = accounts.get('wallet_2')!;
        const appraiser1 = accounts.get('wallet_3')!;
        const appraiser2 = accounts.get('wallet_4')!;
        const appraiser3 = accounts.get('wallet_5')!;
        const borrower = accounts.get('wallet_6')!;
        
        // Complete setup (initialize, register, authorize, appraise, loan)
        let setupBlock = chain.mineBlock([
            Tx.contractCall('lending-protocol-contract', 'initialize', [types.principal(treasury.address)], deployer.address),
            Tx.contractCall('lending-protocol-contract', 'register-collection', [
                types.ascii('BORED_APES'), types.principal(nftContract.address), types.utf8('https://api.boredapes.com/'),
                types.uint(5000), types.uint(500), types.uint(2000), types.ascii('linear'),
                types.list([types.ascii('Common'), types.ascii('Rare')]), types.uint(1000000), types.uint(100000000)
            ], deployer.address),
            Tx.contractCall('lending-protocol-contract', 'authorize-appraiser', [types.principal(appraiser1.address), types.list([types.ascii('BORED_APES')])], deployer.address),
            Tx.contractCall('lending-protocol-contract', 'authorize-appraiser', [types.principal(appraiser2.address), types.list([types.ascii('BORED_APES')])], deployer.address),
            Tx.contractCall('lending-protocol-contract', 'authorize-appraiser', [types.principal(appraiser3.address), types.list([types.ascii('BORED_APES')])], deployer.address),
        ]);
        
        let appraisalFlow = chain.mineBlock([
            Tx.contractCall('lending-protocol-contract', 'request-appraisal', [types.ascii('BORED_APES'), types.uint(1)], borrower.address),
        ]);
        
        let appraisalSubmit = chain.mineBlock([
            Tx.contractCall('lending-protocol-contract', 'submit-appraisal', [types.uint(1), types.uint(50000000)], appraiser1.address),
            Tx.contractCall('lending-protocol-contract', 'submit-appraisal', [types.uint(1), types.uint(55000000)], appraiser2.address),
            Tx.contractCall('lending-protocol-contract', 'submit-appraisal', [types.uint(1), types.uint(60000000)], appraiser3.address),
        ]);
        
        let loanBlock = chain.mineBlock([
            Tx.contractCall('lending-protocol-contract', 'apply-for-loan', [
                types.ascii('BORED_APES'), types.uint(1), types.uint(25000000), types.uint(1440)
            ], borrower.address),
        ]);
        
        // Verify loan was created
        assertEquals(loanBlock.receipts[0].result.expectOk(), types.uint(1));
        
        // First, check that the borrower has lending tokens (they should have received loan amount minus fees)
        // Let's make a partial repayment first
        let partialRepayBlock = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'repay-loan',
                [
                    types.uint(1), // loan ID
                    types.uint(10000000) // 100 STX partial repayment
                ],
                borrower.address
            ),
        ]);
        
        assertEquals(partialRepayBlock.receipts.length, 1);
        const partialResult = partialRepayBlock.receipts[0].result.expectOk().expectTuple();
        assertEquals(partialResult['loan-id'], types.uint(1));
        assertEquals(partialResult['amount-repaid'], types.uint(10000000));
        assertEquals(partialResult['fully-repaid'], types.bool(false));
        
        // Verify loan state after partial repayment
        let loanQuery = chain.callReadOnlyFn(
            'lending-protocol-contract',
            'get-loan',
            [types.uint(1)],
            borrower.address
        );
        
        const partialLoan = loanQuery.result.expectSome().expectTuple();
        assertEquals(partialLoan['state'], types.uint(0)); // Still Active
        assertEquals(partialLoan['repaid-amount'], types.uint(10000000));
        
        // Now make full repayment of remaining amount
        let fullRepayBlock = chain.mineBlock([
            Tx.contractCall(
                'lending-protocol-contract',
                'repay-loan',
                [
                    types.uint(1),
                    types.uint(20000000) // Repay remaining amount (plus any accrued interest)
                ],
                borrower.address
            ),
        ]);
        
        assertEquals(fullRepayBlock.receipts.length, 1);
        const fullResult = fullRepayBlock.receipts[0].result.expectOk().expectTuple();
        assertEquals(fullResult['fully-repaid'], types.bool(true));
        
        // Verify final loan state
        let finalLoanQuery = chain.callReadOnlyFn(
            'lending-protocol-contract',
            'get-loan',
            [types.uint(1)],
            borrower.address
        );
        
        const finalLoan = finalLoanQuery.result.expectSome().expectTuple();
        assertEquals(finalLoan['state'], types.uint(1)); // Repaid
        assertEquals(finalLoan['remaining-amount'], types.uint(0));
        
        // Verify borrower history was updated
        let finalHistoryQuery = chain.callReadOnlyFn(
            'lending-protocol-contract',
            'get-borrower-history',
            [types.principal(borrower.address)],
            borrower.address
        );
        
        const finalHistory = finalHistoryQuery.result.expectSome().expectTuple();
        assertEquals(finalHistory['active-loans'], types.uint(0));
        assertEquals(finalHistory['repaid-loans'], types.uint(1));
        assertEquals(finalHistory['current-debt'], types.uint(0));
    },
});
