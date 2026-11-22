import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EntityType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEntityDto {
  @ApiProperty({ example: 'Smith Family Trust' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: EntityType,
    example: EntityType.FAMILY_TRUST,
    description: 'INDIVIDUAL | JOINT | FAMILY_TRUST | UNIT_TRUST | COMPANY | SMSF',
  })
  @IsEnum(EntityType)
  @IsNotEmpty()
  type: EntityType;

  @ApiPropertyOptional({ example: 'XX-XXX-XXX-123' })
  @IsString()
  @IsOptional()
  abnOrTfnMasked?: string;
}

export class UpdateEntityDto extends PartialType(CreateEntityDto) {}
