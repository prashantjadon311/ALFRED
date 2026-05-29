import { BadRequestException } from "@nestjs/common";
import { ObjectId } from "mongodb";

export function toObjectId(id: string, name = "id") {
  if (!ObjectId.isValid(id)) throw new BadRequestException(`${name} must be a valid ObjectId`);
  return new ObjectId(id);
}

export function oid(id: ObjectId | string) {
  return typeof id === "string" ? new ObjectId(id) : id;
}

export function serializeDoc<T extends { _id?: ObjectId; userId?: ObjectId; projectId?: ObjectId; [key: string]: unknown }>(doc: T | null) {
  if (!doc) return null;
  const out: Record<string, unknown> = { ...doc };
  if (doc._id) out.id = doc._id.toHexString();
  delete out._id;
  for (const key of Object.keys(out)) {
    const value = out[key];
    if (value instanceof ObjectId) out[key] = value.toHexString();
  }
  return out;
}

export function serializeDocs<T extends { _id?: ObjectId }>(docs: T[]) {
  return docs.map((doc) => serializeDoc(doc));
}
