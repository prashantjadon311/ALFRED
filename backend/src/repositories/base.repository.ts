import { Filter, ObjectId, OptionalUnlessRequiredId, UpdateFilter } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { serializeDoc, serializeDocs } from "../common/utils/object-id";

export interface OwnedDoc {
  _id?: ObjectId;
  userId?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

export class BaseRepository<T extends OwnedDoc> {
  constructor(protected readonly db: DatabaseService, protected readonly collectionName: string) {}

  collection() {
    return this.db.collection<T>(this.collectionName);
  }

  async create(doc: OptionalUnlessRequiredId<T>) {
    const now = new Date();
    const insertDoc = { createdAt: now, updatedAt: now, ...doc } as OptionalUnlessRequiredId<T>;
    const result = await this.collection().insertOne(insertDoc);
    return this.findById(result.insertedId as ObjectId);
  }

  async findById(id: ObjectId, userId?: ObjectId, projection?: Record<string, 0 | 1>) {
    const filter: Filter<T> = { _id: id } as Filter<T>;
    if (userId) (filter as Record<string, unknown>).userId = userId;
    return this.collection().findOne(filter, { projection });
  }

  async listByUser(userId: ObjectId, filter: Filter<T> = {} as Filter<T>, options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1>; projection?: Record<string, 0 | 1> } = {}) {
    const finalFilter = { ...filter, userId } as Filter<T>;
    const cursor = this.collection().find(finalFilter, { projection: options.projection }).sort(options.sort ?? { updatedAt: -1 });
    if (options.skip) cursor.skip(options.skip);
    if (options.limit) cursor.limit(options.limit);
    const [items, total] = await Promise.all([cursor.toArray(), this.collection().countDocuments(finalFilter)]);
    return { items, total };
  }

  async updateById(id: ObjectId, userId: ObjectId, patch: Partial<T>) {
    await this.collection().updateOne({ _id: id, userId } as Filter<T>, { $set: { ...patch, updatedAt: new Date() } } as UpdateFilter<T>);
    return this.findById(id, userId);
  }

  async deleteById(id: ObjectId, userId: ObjectId) {
    const result = await this.collection().deleteOne({ _id: id, userId } as Filter<T>);
    return result.deletedCount === 1;
  }

  serialize(doc: T | null) {
    return serializeDoc(doc);
  }

  serializeMany(docs: T[]) {
    return serializeDocs(docs);
  }
}
