import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import http from "http";
import cors from "cors";
import { json } from "body-parser";
import {
  JsonRpcProvider,
  Wallet,
  Contract,
  parseEther,
  formatEther,
} from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import connectDB from "./db/conn/database";
import User from "./db/entities/user.entity";
import Product from "./db/entities/product.entity";
import { Context, IUser } from "./types";
import { IResolvers } from "@graphql-tools/utils";
dotenv.config();

interface ApolloContext extends Context {
  contract: Contract;
}

export const resolvers: IResolvers = {
  Query: {
    product: async (_, { id }, { contract }) => {
      try {
        const [name, price, quantity] = await contract.getProduct(id);
        const dbProduct = await Product.findOne({ chainId: id }).populate(
          "owner"
        );

        if (!dbProduct) {
          throw new Error("Product not found in database");
        }

        return {
          id,
          chainId: id,
          name,
          price: formatEther(price),
          quantity: quantity.toString(),
          owner: dbProduct.owner,
          createdAt: dbProduct.createdAt,
        };
      } catch (error) {
        console.error("Error fetching product:", error);
        throw new Error("Failed to fetch product");
      }
    },

    //@ts-ignore
    productCount: async (_, __, { contract }) => {
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
        const user = await User.findById(userId).populate("products");
        if (!user) {
          throw new Error("User not found");
        }
        return user.products;
      } catch (error) {
        console.error("Error fetching products by user:", error);
        throw new Error("Failed to fetch products by user");
      }
    },
  },

  Mutation: {
    addProduct: async (
      _,
      {
        name,
        price,
        quantity,
      }: { name: string; price: string; quantity: number },
      { contract, user }
    ) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      try {
        const tx = await contract.addProduct(name, parseEther(price), quantity);
        await tx.wait();

        let productCount = await contract.getProductCount();
        productCount = productCount.toString();

        const newProductId = Number(productCount) + 1;

        const newProduct = new Product({
          chainId: newProductId.toString(),
          name,
          price,
          quantity,
          owner: user._id,
        });

        await newProduct.save();

        // Update user's products array
        await User.findByIdAndUpdate(user._id, {
          $push: { products: newProduct._id },
        });

        return {
          id: newProduct._id,
          chainId: newProductId,
          name,
          price,
          quantity,
          owner: user,
          createdAt: newProduct.createdAt,
        };
      } catch (error) {
        console.error("Error adding product:", error);
        throw new Error("Failed to add product");
      }
    },

    updateProduct: async (
      _,
      { id, price, quantity }: { id: string; price: string; quantity: number },
      { contract, user }
    ) => {
      if (!user) {
        throw new Error("Authentication required");
      }

      try {
        const product = await Product.findOne({ chainId: id }).populate<{
          owner: IUser;
        }>("owner");
        if (
          !product ||
          (product.owner as IUser)._id.toString() !== user._id.toString()
        ) {
          throw new Error("Product not found or unauthorized");
        }

        const tx = await contract.updateProduct(
          id,
          parseEther(price),
          quantity
        );
        await tx.wait();

        product.price = price;
        product.quantity = quantity;
        await product.save();

        return {
          id,
          chainId: id,
          name: product.name,
          price,
          quantity,
          owner: user,
          createdAt: product.createdAt,
        };
      } catch (error) {
        console.error("Error updating product:", error);
        throw new Error("Failed to update product");
      }
    },

    createUser: async (
      _,
      { address, username }: { address: string; username: string }
    ) => {
      try {
        const existingUser = await User.findOne({
          address: address.toLowerCase(),
        });
        if (existingUser) {
          throw new Error("User already exists");
        }

        const user = new User({
          address: address.toLowerCase(),
          username,
          products: [],
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

const startServer = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  // Database connection
  await connectDB();

  // Contract setup
  const provider = new JsonRpcProvider(process.env.ALCHEMY_API_KEY_URL);
  const wallet = new Wallet(process.env.PRIVATE_KEY || "", provider);
  const contractAddress = process.env.CONTRACT_ADDRESS || "";
  const contractABI = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        "../artifacts/contracts/InventoryManager.sol/InventoryManager.json"
      ),
      "utf-8"
    )
  ).abi;

  const contract = new Contract(contractAddress, contractABI, wallet);

  const typeDefs = fs.readFileSync(
    path.join(__dirname, "../src/schema/schema.graphql"),
    "utf-8"
  );

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<ApolloContext> => {
        const address = req.headers.authorization;
        let user;
        if (address) {
          user = await User.findOne({ address: address.toLowerCase() });
        }
        return {
          user: user as IUser,
          contract,
        };
      },
    })
  );

  const PORT = process.env.PORT || 4244;
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
