import { Document } from "mongoose";

export interface IUser extends Document {
  address: string;
  username: string;
  products: IProduct[];
  createdAt: Date;
}

export interface IProduct extends Document {
  chainId: string;
  owner: IUser["_id"];
  name: string;
  price: string;
  quantity: number;
  createdAt: Date;
}

export interface Context {
  user?: IUser;
}
