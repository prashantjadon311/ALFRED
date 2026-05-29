import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { redactSecrets } from "../security/redaction.util";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";
export interface AuditLogDoc extends OwnedDoc { userId?: ObjectId; entityType: string; entityId?: string; action: string; metadata?: unknown; ipAddress?: string; userAgent?: string; requestId?: string; createdAt: Date; }
@Injectable()
export class AuditLogsRepository extends BaseRepository<AuditLogDoc> {
  constructor(db: DatabaseService) { super(db, "audit_logs"); }
  audit(doc: Omit<AuditLogDoc, "createdAt">) { return this.create({ ...doc, metadata: redactSecrets(doc.metadata), createdAt: new Date() } as any); }
}
