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
import { UsersService } from '../application/users.service';
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
import { Public } from '../guards/decorators/public.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@UseGuards(BasicAuthGuard)
@ApiBasicAuth('basicAuth')
@Controller('users')
@SkipThrottle()
export class UsersController {
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly usersService: UsersService,
    private readonly usersQueryService: UsersQueryService,
  ) {
    if (appConfig.IOC_LOG) console.log('UsersController created');
  }
  //@Public()
  @Get()
  @ApiPaginatedResponse(UserViewDto)
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.getAll(query);
  }

  @Post()
  @ApiBadRequestResponse({
    description: `Bad request`,
    type: ErrorResponseBodyDto,
  })
  async createUser(
    @Body() createUserInputDto: CreateUserInputDto,
  ): Promise<UserViewDto> {
    const userId = await this.usersService.createUser(createUserInputDto);

    return this.usersQueryService.getUserViewDtoOrFail(userId, true);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    return this.usersService.deleteUserById(id);
  }
}
