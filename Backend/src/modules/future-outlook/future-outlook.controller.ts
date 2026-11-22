import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FutureOutlookService } from './future-outlook.service';
import { FutureOutlookLeversDto } from './dto/future-outlook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Future Outlook & Scenario Modelling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews/:reviewId/future-outlook')
export class FutureOutlookController {
  constructor(private readonly futureOutlookService: FutureOutlookService) {}

  @Get()
  @ApiOperation({
    summary:
      'Load saved future outlook scenario and calculated year-by-year projections (Year 0 to N)',
  })
  getScenario(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.futureOutlookService.getScenario(adviserId, reviewId);
  }

  @Post('simulate')
  @ApiOperation({
    summary:
      'Stateless what-if projection simulation returning instant hero outputs and full trajectory',
  })
  simulate(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
    @Body() levers: FutureOutlookLeversDto,
  ) {
    return this.futureOutlookService.simulate(adviserId, reviewId, levers);
  }

  @Put()
  @ApiOperation({ summary: 'Persist customized future outlook scenario levers' })
  saveScenario(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: FutureOutlookLeversDto,
  ) {
    return this.futureOutlookService.saveScenario(adviserId, reviewId, dto);
  }
}
