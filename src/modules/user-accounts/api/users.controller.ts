import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserViewDto } from './view-dto/user.view-dto';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { CreateUserInputDto } from './input-dto/create-users.input-dto';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { ApiBadRequestResponse, ApiBasicAuth } from '@nestjs/swagger';
import { UsersQueryService } from '../application/query/users.query-service';
import { appConfig } from '../../../core/settings/config';
import { ErrorResponseBodyDto } from '../../../core/dto/base.error-responce-body.view-dto';
import { ApiPaginatedResponse } from '../../../core/decorators/swagger/api-paginated-response';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/usecases/admins/create-user.usecase';
import { DeleteUserCommand } from '../application/usecases/admins/delete-user.usecase';
import { GetAllUsersQuery } from '../application/queries/get-all-users.query';
import { GetUserQuery } from '../application/queries/get-user.query';

@UseGuards(BasicAuthGuard)
@ApiBasicAuth('basicAuth')
@Controller('users')
@SkipThrottle()
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {
    if (appConfig.IOC_LOG) console.log('UsersController created');
  }
  //@Public()
  @Get()
  @ApiPaginatedResponse(UserViewDto)
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.queryBus.execute<
      GetAllUsersQuery,
      PaginatedViewDto<UserViewDto[]>
    >(new GetAllUsersQuery(query));
  }

  @Post()
  @ApiBadRequestResponse({
    description: `Bad request`,
    type: ErrorResponseBodyDto,
  })
  async createUser(
    @Body() createUserInputDto: CreateUserInputDto,
  ): Promise<UserViewDto> {
    const userId = await this.commandBus.execute<CreateUserCommand, string>(
      new CreateUserCommand(createUserInputDto),
    );

    return this.queryBus.execute<GetUserQuery, UserViewDto>(
      new GetUserQuery(userId, true),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.commandBus.execute<DeleteUserCommand, void>(
      new DeleteUserCommand(id),
    );
  }
}
