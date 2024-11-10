# DeFi Inventory Manager

A decentralized inventory management system built with Solidity, GraphQL, and Node.js.

## Deployed Contract

[0x164B0B8C6cD6b8aEA4f20c3BE7E3955aD2550aa8](https://sepolia.etherscan.io/address/0x164B0B8C6cD6b8aEA4f20c3BE7E3955aD2550aa8#code)

## Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- An Ethereum wallet (e.g., MetaMask)
- Alchemy account for Sepolia testnet access
- Some Sepolia test ETH

## Environment Setup

1. Create a `.env` file in the root directory:

ALCHEMY_API_KEY_URL=your_alchemy_api_url
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
CONTRACT_ADDRESS=deployed_contract_address
PORT=4244

## Installation

Clone the repository

```bash
git clone <repository-url>
cd defi-inventory
```

Install dependencies

```bash
npm install
```

## Smart Contract Deployment

1. Compile the contract:

```bash
npx hardhat compile
```

2. Deploy the contract:

```bash
npx hardhat ignition deploy ./ignition/modules/InventoryManager.js --network sepolia
```

3. Verify the contract on Etherscan:

```bash
npx hardhat verify --network sepolia <contract_address>
```

## Running the GraphQL Server

1. Update your `.env` file with the deployed contract address
2. Start the server:

```bash
npm run start
```

The GraphQL playground will be available at: `http://localhost:4244/graphql`

## GraphQL API Usage

### Queries

1. Get a product:

```graphql
query GetProduct($id: Int!) {
  getProduct(id: $id) {
    id
    name
    price
    quantity
  }
}
```

2. Get product count:

```graphql
query GetProductCount {
  getProductCount
}
```

### Mutations

1. Add a product:

```graphql
mutation AddProduct($name: String!, $price: String!, $quantity: Int!) {
  addProduct(name: $name, price: $price, quantity: $quantity)
}
```

```graphql
mutation {
  addProduct(name: "Test Product", price: "1.5", quantity: 100) {
    id
    name
    price
    quantity
  }
}
```

2. Update a product:

```graphql
mutation UpdateProduct($id: Int!, $price: String!, $quantity: Int!) {
  updateProduct(id: $id, price: $price, quantity: $quantity)
}
```

```graphql
mutation {
  updateProduct(id: "1", price: "2.0", quantity: 150) {
    id
    name
    price
    quantity
  }
}
```


## Project Structure

- `/contracts`: Smart contract source code
- `/src`: GraphQL server and API implementation
- `/test`: Smart contract test files
- `/ignition`: Deployment configuration
- `/schema`: GraphQL schema definitions

## Security Considerations

- The contract implements manual reentrancy protection
- Only the contract owner can add or update products
- Price values are handled in Wei for precision
- Ownership transfer functionality is protected

## Network Support

Currently configured for:
- Sepolia testnet
- Local Hardhat network (for testing)

## License

MIT

