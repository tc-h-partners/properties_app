import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePublicEnquiryDto {
  @ApiProperty({ example: 'David Miller' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'david.miller@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+61 412 345 678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'ANNUAL_REVIEW_BOOKING',
    description: 'Enquiry type: ANNUAL_REVIEW_BOOKING | PRE_PURCHASE | STRATEGIC_ADVISORY',
  })
  @IsString()
  @IsNotEmpty()
  enquiryType: string;

  @ApiProperty({
    example: 'We would like to book an annual review session for our property portfolio.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
