import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { appConfig } from '../../../core/settings/config';
import { JwtRefreshAuthGuard } from '../guards/bearer/jwt-refresh-auth.guard';
import {
  DeviceId,
  UserId,
} from '../guards/decorators/param/extract-user-from-request.decorator';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeleteUserSessionByIdCommand } from '../application/usecases/sessions/delete-user-session-by-id-use.case';
import { GetUserActiveSessionsQuery } from '../application/queries/get-user-active-sessions.query';
import { SessionViewDto } from './view-dto/session-view.dto';
import { DeleteUserSessionsExcCurCommand } from '../application/usecases/sessions/delete-user-sessions-exc-cur-use.case';

@UseGuards(JwtRefreshAuthGuard)
@Controller('security')
export class SessionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    if (appConfig.IOC_LOG) console.log('SecurityDevicesController created');
  }

  @HttpCode(HttpStatus.OK)
  @Get('devices')
  getUserActiveSessions(@UserId() userId: string) {
    return this.queryBus.execute<GetUserActiveSessionsQuery, SessionViewDto[]>(
      new GetUserActiveSessionsQuery(userId),
    );
  }

  @Delete('devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserSessionsExcCur(
    @DeviceId('deviceId') deviceId: string,
    @UserId() userId: string,
  ) {
    await this.commandBus.execute<DeleteUserSessionsExcCurCommand, boolean>(
      new DeleteUserSessionsExcCurCommand(deviceId, userId),
    );
  }

  @Delete('devices/:deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserSessionById(
    @Param('deviceId') deviceId: string,
    @UserId() userId: string,
  ) {
    await this.commandBus.execute<DeleteUserSessionByIdCommand, boolean>(
      new DeleteUserSessionByIdCommand(deviceId, userId),
    );
  }
}
