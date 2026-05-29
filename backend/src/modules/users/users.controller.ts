import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RequestUser } from "../../common/types/request-user";
import { toObjectId } from "../../common/utils/object-id";
import { ok } from "../../contracts/api-response.types";
import { UsersRepository } from "../../repositories/users.repository";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly repo: UsersRepository) {}

  @Get("me")
  async me(@CurrentUser() u: RequestUser) {
    const user = await this.repo.findById(toObjectId(u.userId, "userId"), undefined, { passwordHash: 0, refreshTokenHash: 0 });
    return ok(this.repo.serialize(user));
  }
}
