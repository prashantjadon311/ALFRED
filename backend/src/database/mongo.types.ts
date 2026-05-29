import { ObjectId } from "mongodb";

export interface BaseDoc {
  _id?: ObjectId;
  userId?: ObjectId;
  createdAt: Date;
  updatedAt?: Date;
}
