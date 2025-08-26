import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { WorksService, CreateWorkDto } from './works.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/decorators/user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Post()
  create(@Body() createWorkDto: CreateWorkDto, @User('id') userId: string) {
    return this.worksService.create(createWorkDto, userId);
  }

  @Get()
  findAll(@User('id') userId: string) {
    return this.worksService.findAll(userId);
  }

  @Get('search')
  search(@Query('q') searchTerm: string, @User('id') userId: string) {
    return this.worksService.search(searchTerm, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User('id') userId: string) {
    return this.worksService.findOne(id, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkDto: Partial<CreateWorkDto>,
    @User('id') userId: string
  ) {
    return this.worksService.update(id, updateWorkDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User('id') userId: string) {
    return this.worksService.remove(id, userId);
  }
}