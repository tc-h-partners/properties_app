import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'adviser@propertycfo.com.au' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
