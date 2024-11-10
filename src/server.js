const { ApolloServer } = require("apollo-server-express");
const express = require("express");
const {
  JsonRpcProvider,
  Wallet,
  Contract,
  parseEther,
  formatEther,
} = require("ethers");
const fs = require("fs");
const path = require("path");
const connectDB = require("./db/conn/database");
const User = require("./db/entities/user.entity");
const Product = require("./db/entities/product.entity");
require("dotenv").config();

// Database connection
connectDB();

// Contract setup remains the same
const provider = new JsonRpcProvider(process.env.ALCHEMY_API_KEY_URL);
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

// Enhanced resolvers
const resolvers = {
  Query: {
    product: async (_, { id }) => {
      try {
        const [name, price, quantity] = await contract.getProduct(id);
        const dbProduct = await Product.findOne({ chainId: id }).populate(
          "owner"
        );

        return {
          id,
          chainId: id,
          name,
          price: formatEther(price),
          quantity: quantity.toString(),
          owner: dbProduct?.owner,
          createdAt: dbProduct?.createdAt,
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
    users: async () => {
      try {
        return await User.find().populate("products");
      } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error("Failed to fetch users");
      }
    },
    user: async (_, { id }) => {
      try {
        return await User.findById(id).populate("products");
      } catch (error) {
        console.error("Error fetching user:", error);
        throw new Error("Failed to fetch user");
      }
    },
    productsByUser: async (_, { userId }) => {
      try {
        return await Product.find({ owner: userId }).populate("owner");
      } catch (error) {
        console.error("Error fetching user products:", error);
        throw new Error("Failed to fetch user products");
      }
    },
  },
  Mutation: {
    addProduct: async (_, { name, price, quantity }, { user }) => {
      try {
        const priceWei = parseEther(price);
        const tx = await contract.addProduct(name, priceWei, quantity);
        await tx.wait();

        const productId = await contract.getProductCount();

        // Save to MongoDB
        const product = new Product({
          chainId: productId.toString(),
          name,
          price,
          quantity,
          owner: user.id,
        });

        await product.save();

        // Update user's products
        await User.findByIdAndUpdate(user.id, {
          $push: { products: product._id },
        });

        return {
          id: productId.toString(),
          chainId: productId.toString(),
          name,
          price,
          quantity,
          owner: user,
          createdAt: product.createdAt,
        };
      } catch (error) {
        console.error("Error adding product:", error);
        throw new Error("Failed to add product");
      }
    },
    createUser: async (_, { address, username }) => {
      try {
        // check if user already exists
        const existingUser = await User.findOne({
          address: address.toLowerCase(),
        });
        if (existingUser) {
          throw new Error("User already exists");
        }

        const user = new User({
          address: address.toLowerCase(),
          username,
        });
        await user.save();
        return user;
      } catch (error) {
        console.error("Error creating user:", error);
        throw new Error("Failed to create user");
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
    context: async ({ req }) => {
      // Basic auth context
      const address = req.headers.authorization;
      if (address) {
        const user = await User.findOne({ address: address.toLowerCase() });
        return { user };
      }
      return {};
    },
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
