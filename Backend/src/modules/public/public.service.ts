import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublicEnquiryDto } from './dto/create-enquiry.dto';

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async createEnquiry(dto: CreatePublicEnquiryDto) {
    return this.prisma.publicEnquiry.create({
      data: {
        fullName: dto.fullName,
        email: dto.email.toLowerCase().trim(),
        phone: dto.phone,
        enquiryType: dto.enquiryType,
        message: dto.message,
        status: 'NEW',
      },
    });
  }

  async listEnquiries() {
    return this.prisma.publicEnquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
