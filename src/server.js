const { ApolloServer } = require("apollo-server-express");
const express = require("express");
const { JsonRpcProvider, Wallet, Contract, parseEther, formatEther } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Contract setup
const provider = new JsonRpcProvider(
  process.env.ALCHEMY_API_KEY_URL
);

const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = process.env.CONTRACT_ADDRESS;
const contractABI = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      "../artifacts/contracts/InventoryManager.sol/InventoryManager.json"
    )
  )
).abi;

const contract = new Contract(contractAddress, contractABI, wallet);

// GraphQL Resolvers
const resolvers = {
  Query: {
    product: async (_, { id }) => {
      try {
        const [name, price, quantity] = await contract.getProduct(id);
        return {
          id,
          name,
          price: formatEther(price),
          quantity: quantity.toString(),
        };
      } catch (error) {
        console.error("Error fetching product:", error);
        throw new Error("Failed to fetch product");
      }
    },
    productCount: async () => {
      try {
        const count = await contract.getProductCount();
        return count.toString();
      } catch (error) {
        console.error("Error fetching product count:", error);
        throw new Error("Failed to fetch product count");
      }
    },
  },
  Mutation: {
    addProduct: async (_, { name, price, quantity }) => {
      try {
        const priceWei = parseEther(price);
        const tx = await contract.addProduct(name, priceWei, quantity);
        await tx.wait();

        const productId = await contract.getProductCount();
        return {
          id: productId.toString(),
          name,
          price,
          quantity,
        };
      } catch (error) {
        console.error("Error adding product:", error);
        throw new Error("Failed to add product");
      }
    },
    updateProduct: async (_, { id, price, quantity }) => {
      try {
        const priceWei = parseEther(price);
        const tx = await contract.updateProduct(id, priceWei, quantity);
        await tx.wait();

        const [name, updatedPrice, updatedQuantity] = await contract.getProduct(
          id
        );
        return {
          id,
          name,
          price: formatEther(updatedPrice),
          quantity: updatedQuantity.toString(),
        };
      } catch (error) {
        console.error("Error updating product:", error);
        throw new Error("Failed to update product");
      }
    },
  },
};

// Server setup
async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs: fs.readFileSync(
      path.join(__dirname, "schema/schema.graphql"),
      "utf-8"
    ),
    resolvers,
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4244;
  app.listen(PORT, () => {
    console.log(
      `Server running at http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

startServer().catch(console.error);
