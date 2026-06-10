import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface UserDoc extends OwnedDoc {
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  status: "active" | "disabled";
  refreshTokenHash?: string;
}

@Injectable()
export class UsersRepository extends BaseRepository<UserDoc> {
  constructor(db: DatabaseService) { super(db, "users"); }
  findByEmail(email: string) { return this.collection().findOne({ email: email.toLowerCase() }); }
  updateRefreshToken(userId: ObjectId, refreshTokenHash?: string) {
    return this.collection().updateOne({ _id: userId }, refreshTokenHash ? { $set: { refreshTokenHash, updatedAt: new Date() } } : { $unset: { refreshTokenHash: "" }, $set: { updatedAt: new Date() } });
  }
  rotateRefreshToken(userId: ObjectId, currentRefreshTokenHash: string, refreshTokenHash: string) {
    return this.collection().updateOne(
      { _id: userId, refreshTokenHash: currentRefreshTokenHash },
      { $set: { refreshTokenHash, updatedAt: new Date() } }
    );
  }
}
