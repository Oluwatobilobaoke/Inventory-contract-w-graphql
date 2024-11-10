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
MONGODB_URI=mongodb://localhost:27017/defi-inventory

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
query {
  product(id: "1") {
    id
    chainId
    name
    price
    quantity
    owner {
      username
      address
    }
    createdAt
  }
}
```

2. Get product count:

```graphql
query GetProductCount {
  getProductCount
}
```

3. Get all users:

```graphql
query {
  users {
    id
    username
    address
    products {
      name
      price
      quantity
    }
    createdAt
  }
}
```

4. Get user by ID:

```graphql
query {
  user(id: "1") {
    id
    username
    address
  }
}
```

```graphql
query {
  user(id: "user_id_here") {
    username
    address
    products {
      name
      price
    }
  }
}
```

5. Get products by user:

```graphql
query {
  productsByUser(address: "user_address_here") {
    name
    price
  }
}
```

```graphql
query {
  productsByUser(userId: "user_id_here") {
    name
    price
    quantity
    createdAt
  }
}
```

### Mutations

1. Create user:

```graphql
mutation {
  createUser(address: "0x123...", username: "john_doe") {
    id
    username
    address
    createdAt
  }
}
```

2. Add product (requires authentication):

```graphql
mutation {
  addProduct(name: "Product Name", price: 100, quantity: 10) {
    id
    chainId
    name
    price
    quantity
  }
}
```

```graphql
mutation {
  addProduct(name: "Test Product", price: "1.5", quantity: 100) {
    id
    chainId
    name
    price
    quantity
    owner {
      username
    }
    createdAt
  }
}
```

## Authentication

Add your Ethereum address in the HTTP headers:

```json
{
  "Authorization": "0x123..." // Your Ethereum address
}
```

## Project Structure

- `/contracts`: Smart contract source code
- `/src`
  - `/db`: MongoDB models and connection
  - `/schema`: GraphQL schema
  - `server.js`: Main server file
- `/test`: Contract tests
- `/ignition`: Deployment configs

## Security Considerations

- Contract implements manual reentrancy protection
- Owner-only product management
- Wei-based price handling
- Protected ownership transfers
- MongoDB data validation
- Authentication via Ethereum addresses

## Network Support

- Sepolia testnet
- Local Hardhat network (testing)

## License

MIT
