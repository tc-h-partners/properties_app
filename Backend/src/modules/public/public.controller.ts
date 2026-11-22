import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { CreatePublicEnquiryDto } from './dto/create-enquiry.dto';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Public & Marketing')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Post('enquiries')
  @ApiOperation({ summary: 'Submit public website booking or contact enquiry' })
  createEnquiry(@Body() dto: CreatePublicEnquiryDto) {
    return this.publicService.createEnquiry(dto);
  }

  @Get('enquiries')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all public inquiries (Adviser authenticated)' })
  listEnquiries() {
    return this.publicService.listEnquiries();
  }
}
