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

dotenv.config();

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

  const resolvers = {
    Query: {
      //@ts-ignore
      product: async (_, { id }: { id: string }) => {
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
      // ... rest of the resolvers
    },
    Mutation: {
      // ... mutation resolvers
    },
  };

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: true, // Add this line
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        const address = req.headers.authorization;
        if (address) {
          const user = await User.findOne({ address: address.toLowerCase() });
          return { user: user as IUser };
        }
        return {};
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
