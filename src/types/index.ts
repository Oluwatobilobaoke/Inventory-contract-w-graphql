import { Document } from "mongoose";

import { Schema } from "mongoose";

export interface IUser extends Document {
  _id: string | Schema.Types.ObjectId;
  address: string;
  username: string;
  products: IProduct[];
  createdAt: Date;
}

export interface IProduct extends Document {
  _id: string | Schema.Types.ObjectId;
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
