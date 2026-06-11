import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { redactSecrets } from "../security/redaction.util";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface AuditLogDoc extends OwnedDoc {
  userId?: ObjectId;
  workspaceId?: ObjectId;
  entityType: string;
  entityId?: string;
  action: string;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  createdAt: Date;
}

@Injectable()
export class AuditLogsRepository extends BaseRepository<AuditLogDoc> {
  constructor(db: DatabaseService) {
    super(db, "audit_logs");
  }

  audit(doc: Omit<AuditLogDoc, "createdAt">) {
    return this.create({
      ...doc,
      metadata: redactSecrets(doc.metadata),
      createdAt: new Date()
    } as any);
  }

  listWorkspace(userId: ObjectId, workspaceId: ObjectId, skip: number, limit: number) {
    const filter = { userId, workspaceId };
    return Promise.all([
      this.collection().find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      this.collection().countDocuments(filter)
    ]).then(([items, total]) => ({ items, total }));
  }

  listUserScope(userId: ObjectId, skip: number, limit: number) {
    const filter = {
      userId,
      $or: [
        { workspaceId: { $exists: false } },
        { workspaceId: null }
      ]
    } as any;
    return Promise.all([
      this.collection().find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      this.collection().countDocuments(filter)
    ]).then(([items, total]) => ({ items, total }));
  }

  listAllForUser(userId: ObjectId, skip: number, limit: number) {
    return this.listByUser(userId, {} as any, {
      skip,
      limit,
      sort: { createdAt: -1 }
    });
  }
}
