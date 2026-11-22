import { ApiProperty } from '@nestjs/swagger';
import { WorkflowStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateFinDataStatusDto {
  @ApiProperty({
    enum: WorkflowStatus,
    example: WorkflowStatus.COMPLETED,
    description: 'NOT_STARTED | IN_PROGRESS | COMPLETED',
  })
  @IsEnum(WorkflowStatus)
  @IsNotEmpty()
  status: WorkflowStatus;
}
