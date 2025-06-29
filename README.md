# NFT-Collateralized Lending Protocol

A decentralized lending protocol built on Stacks that allows users to borrow against their NFT collateral with dynamic valuation and oracle-based appraisals.

## 🌟 Features

- **NFT Collateral**: Use NFTs as collateral for loans
- **Dynamic Valuation**: Oracle-based appraisal system with consensus mechanism
- **Flexible Loan Terms**: Customizable loan durations and interest rates
- **Risk Management**: Automated liquidation system with auction mechanism
- **Multi-Collection Support**: Support for multiple NFT collections with different parameters
- **Borrower History**: Track borrower performance and risk assessment

## 🏗️ Architecture

### Core Components

1. **Collection Registry**: Manages supported NFT collections and their parameters
2. **Appraisal System**: Oracle-based NFT valuation with consensus mechanism
3. **Loan Management**: Handles loan creation, repayment, and state management
4. **Liquidation Engine**: Automated liquidation and auction system for defaulted loans
5. **Interest Calculation**: Dynamic interest rates based on collateral quality and LTV

### Key Features

- **Oracle Consensus**: Requires multiple appraisers to agree on NFT valuations
- **Dynamic Interest Rates**: Rates adjust based on loan-to-value ratio and NFT rarity
- **Automated Liquidations**: Triggers when loan-to-value exceeds threshold
- **Partial Repayments**: Allows borrowers to make partial loan repayments
- **Risk Assessment**: Tracks borrower history for improved risk management

## 📋 Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) - Stacks smart contract development tool
- [Node.js](https://nodejs.org/) (for running tests)
- [Stacks CLI](https://docs.stacks.co/references/stacks-cli) (optional, for deployment)

## 🚀 Quick Start

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd NFT-collateralized-lending-protocol
```

2. Install Clarinet (if not already installed):
```bash
# Using Homebrew (macOS)
brew install clarinet

# Using Cargo (Rust)
cargo install clarinet-cli

# Or download from releases
# https://github.com/hirosystems/clarinet/releases
```

### Development

1. Check contract syntax:
```bash
clarinet check
```

2. Run tests:
```bash
clarinet test
```

3. Start local development environment:
```bash
clarinet integrate
```

## 🧪 Testing

The project includes comprehensive tests covering:

### Test Suite

1. **Protocol Initialization** (`test_initialization`)
   - Verifies protocol can be initialized by contract owner
   - Checks protocol parameters are set correctly
   - Validates treasury address configuration

2. **NFT Collection Registration** (`test_collection_registration`)
   - Tests collection registration by owner
   - Validates collection parameters (LTV, interest rates, etc.)
   - Verifies collection enablement status

3. **Appraiser Authorization and NFT Appraisal** (`test_appraisal_system`)
   - Tests appraiser authorization process
   - Validates oracle consensus mechanism
   - Checks median value calculation from multiple appraisals
   - Verifies NFT asset creation with appraisal data

4. **Loan Application and Management** (`test_loan_management`)
   - Tests loan application against appraised NFTs
   - Validates loan parameter calculations
   - Checks borrower history tracking
   - Verifies collateral locking mechanism

5. **Loan Repayment** (`test_loan_repayment`)
   - Tests partial and full loan repayments
   - Validates interest accrual calculations
   - Checks collateral release on full repayment
   - Verifies borrower history updates

### Running Tests

```bash
# Run all tests
clarinet test

# Run specific test
clarinet test --filter "Protocol can be initialized"

# Run with verbose output
clarinet test --verbose
```

## 📚 Smart Contract API

### Public Functions

#### Protocol Management
- `initialize(treasury: principal)` - Initialize the protocol
- `register-collection(...)` - Register a new NFT collection
- `authorize-appraiser(appraiser: principal, collections: list)` - Authorize an oracle

#### Appraisal System
- `request-appraisal(collection-id: string, token-id: uint)` - Request NFT appraisal
- `submit-appraisal(request-id: uint, value: uint)` - Submit appraisal value

#### Loan Operations
- `apply-for-loan(collection-id: string, token-id: uint, amount: uint, duration: uint)` - Apply for loan
- `repay-loan(loan-id: uint, amount: uint)` - Repay loan (partial or full)

### Read-Only Functions
- `get-loan(loan-id: uint)` - Get loan details
- `get-collection(collection-id: string)` - Get collection information
- `get-nft-asset(collection-id: string, token-id: uint)` - Get NFT asset details
- `get-borrower-history(borrower: principal)` - Get borrower's history
- `get-protocol-params()` - Get protocol parameters

## 🔧 Configuration

### Protocol Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Protocol Fee | 2% | Origination fee on loans |
| Liquidation Threshold | 80% | LTV threshold for liquidation |
| Min Loan Duration | 1 day | Minimum loan duration |
| Max Loan Duration | 365 days | Maximum loan duration |
| Oracle Consensus | 3 oracles | Required oracle consensus |
| Auction Duration | 4 days | Liquidation auction duration |

### Collection Parameters

Each NFT collection can be configured with:
- Maximum loan-to-value ratio
- Interest rate range (min/max)
- Interest rate model (linear/exponential)
- Value range (min/max NFT value)
- Rarity levels

## 🏛️ Protocol Flow

### 1. Collection Registration
```
Owner → Register Collection → Set Parameters → Enable Collection
```

### 2. NFT Appraisal
```
User → Request Appraisal → Oracles Submit Values → Consensus Reached → Asset Registered
```

### 3. Loan Application
```
Borrower → Apply for Loan → Validate NFT → Lock Collateral → Issue Loan
```

### 4. Loan Repayment
```
Borrower → Repay Loan → Update State → Release Collateral (if full repayment)
```

### 5. Liquidation (if needed)
```
Monitor LTV → Trigger Liquidation → Start Auction → Settle Debt
```

## 🔒 Security Features

- **Owner-only functions**: Critical functions restricted to contract owner
- **Oracle consensus**: Multiple appraisers required for valuations
- **LTV monitoring**: Continuous monitoring for liquidation triggers
- **Input validation**: Comprehensive parameter validation
- **State management**: Proper loan state transitions

## 🚨 Known Limitations

1. **Oracle Dependency**: Relies on external oracles for NFT valuations
2. **Fixed Interest Model**: Simple interest calculation (compound interest not implemented)
3. **No Secondary Market**: No trading of loan positions
4. **Limited Liquidation**: Basic auction mechanism without advanced features
5. **Mock NFT Integration**: Simplified NFT ownership verification

## 🛠️ Development Notes

### Contract Structure
- **Maps**: Store loans, collections, assets, and borrower history
- **Variables**: Track protocol state and parameters
- **Constants**: Define error codes and protocol constants
- **Functions**: Implement core lending logic

### Gas Optimization
- Efficient data structures
- Minimal storage operations
- Optimized calculations

### Error Handling
- Comprehensive error codes
- Proper validation checks
- Graceful failure modes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Stacks Documentation](https://docs.stacks.co/)
- [Clarity Language Reference](https://docs.stacks.co/references/language-clarity)
- [Clarinet Documentation](https://docs.hiro.so/smart-contracts/clarinet)
- [Stacks Discord](https://discord.gg/stacks)

## ⚠️ Disclaimer

This is an experimental protocol for educational and development purposes. Do not use in production without proper security audits and testing. The protocol involves financial risks and should be thoroughly reviewed before any mainnet deployment.
