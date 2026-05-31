import { Injectable } from "@nestjs/common";
import { ObjectId } from "mongodb";
import { DatabaseService } from "../database/database.service";
import { BaseRepository, OwnedDoc } from "./base.repository";

export interface PromptDoc extends OwnedDoc { workspaceId: ObjectId; title: string; category: string; content: string; favorite: boolean; tags: string[]; version: number; key?: string; }
@Injectable()
export class PromptsRepository extends BaseRepository<PromptDoc> { constructor(db: DatabaseService) { super(db, "prompt_library"); } }
