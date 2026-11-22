import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { CreateEntityDto, UpdateEntityDto } from './dto/entity.dto';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { CreateLoanDto, UpdateLoanDto } from './dto/loan.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------- HOUSEHOLD CRUD ----------------

  async createHousehold(adviserId: string, dto: CreateHouseholdDto) {
    return this.prisma.clientHousehold.create({
      data: {
        adviserId,
        householdName: dto.householdName,
        primaryContactEmail: dto.primaryContactEmail.toLowerCase().trim(),
        primaryContactPhone: dto.primaryContactPhone,
        notes: dto.notes,
      },
    });
  }

  async listHouseholds(adviserId: string) {
    return this.prisma.clientHousehold.findMany({
      where: { adviserId, isArchived: false },
      include: {
        members: true,
        properties: {
          where: { isActive: true },
          include: { loans: { where: { isActive: true } } },
        },
        reviews: {
          orderBy: { financialYear: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getHouseholdById(adviserId: string, householdId: string) {
    const household = await this.prisma.clientHousehold.findUnique({
      where: { id: householdId },
      include: {
        members: true,
        entities: true,
        properties: {
          where: { isActive: true },
          include: {
            entity: true,
            loans: { where: { isActive: true } },
          },
        },
        reviews: {
          orderBy: { financialYear: 'desc' },
        },
      },
    });

    if (!household) throw new NotFoundException('Household not found');
    if (household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this household');
    }

    return household;
  }

  async updateHousehold(adviserId: string, householdId: string, dto: UpdateHouseholdDto) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.clientHousehold.update({
      where: { id: householdId },
      data: {
        householdName: dto.householdName,
        primaryContactEmail: dto.primaryContactEmail?.toLowerCase().trim(),
        primaryContactPhone: dto.primaryContactPhone,
        notes: dto.notes,
      },
    });
  }

  async archiveHousehold(adviserId: string, householdId: string) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.clientHousehold.update({
      where: { id: householdId },
      data: { isArchived: true },
    });
  }

  // ---------------- PERSON CRUD ----------------

  async addPerson(adviserId: string, householdId: string, dto: CreatePersonDto) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.person.create({
      data: {
        householdId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dob: dto.dob ? new Date(dto.dob) : null,
        expectedRetirementAge: dto.expectedRetirementAge,
        currentSuperBalance: dto.currentSuperBalance,
        annualSuperContribution: dto.annualSuperContribution,
        marginalTaxRate: dto.marginalTaxRate,
      },
    });
  }

  async updatePerson(adviserId: string, householdId: string, personId: string, dto: UpdatePersonDto) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.person.update({
      where: { id: personId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dob: dto.dob ? new Date(dto.dob) : undefined,
        expectedRetirementAge: dto.expectedRetirementAge,
        currentSuperBalance: dto.currentSuperBalance,
        annualSuperContribution: dto.annualSuperContribution,
        marginalTaxRate: dto.marginalTaxRate,
      },
    });
  }

  async deletePerson(adviserId: string, householdId: string, personId: string) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.person.delete({ where: { id: personId } });
  }

  // ---------------- ENTITY CRUD ----------------

  async addEntity(adviserId: string, householdId: string, dto: CreateEntityDto) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.ownershipEntity.create({
      data: {
        householdId,
        name: dto.name,
        type: dto.type,
        abnOrTfnMasked: dto.abnOrTfnMasked,
      },
    });
  }

  async updateEntity(adviserId: string, householdId: string, entityId: string, dto: UpdateEntityDto) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.ownershipEntity.update({
      where: { id: entityId },
      data: {
        name: dto.name,
        type: dto.type,
        abnOrTfnMasked: dto.abnOrTfnMasked,
      },
    });
  }

  async deleteEntity(adviserId: string, householdId: string, entityId: string) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.ownershipEntity.delete({ where: { id: entityId } });
  }

  // ---------------- PROPERTY CRUD ----------------

  async addProperty(adviserId: string, householdId: string, dto: CreatePropertyDto) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.property.create({
      data: {
        householdId,
        entityId: dto.entityId || null,
        name: dto.name,
        address: dto.address,
        suburb: dto.suburb,
        state: dto.state.toUpperCase(),
        postcode: dto.postcode,
        propertyCategory: dto.propertyCategory,
        type: dto.type,
        purchaseDate: new Date(dto.purchaseDate),
        purchasePrice: dto.purchasePrice,
        acquisitionCosts: dto.acquisitionCosts || 0,
      },
    });
  }

  async updateProperty(adviserId: string, householdId: string, propertyId: string, dto: UpdatePropertyDto) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.property.update({
      where: { id: propertyId },
      data: {
        entityId: dto.entityId !== undefined ? dto.entityId || null : undefined,
        name: dto.name,
        address: dto.address,
        suburb: dto.suburb,
        state: dto.state ? dto.state.toUpperCase() : undefined,
        postcode: dto.postcode,
        propertyCategory: dto.propertyCategory,
        type: dto.type,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        purchasePrice: dto.purchasePrice,
        acquisitionCosts: dto.acquisitionCosts,
      },
    });
  }

  async deleteProperty(adviserId: string, householdId: string, propertyId: string) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.property.update({
      where: { id: propertyId },
      data: { isActive: false },
    });
  }

  // ---------------- LOAN CRUD ----------------

  async addLoan(adviserId: string, householdId: string, propertyId: string, dto: CreateLoanDto) {
    await this.getHouseholdById(adviserId, householdId);
    const prop = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!prop || prop.householdId !== householdId) {
      throw new NotFoundException('Property not found in this household');
    }

    return this.prisma.loan.create({
      data: {
        propertyId,
        lender: dto.lender,
        accountName: dto.accountName,
        loanType: dto.loanType,
        isOffsetAvailable: dto.isOffsetAvailable || false,
      },
    });
  }

  async updateLoan(adviserId: string, householdId: string, loanId: string, dto: UpdateLoanDto) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.loan.update({
      where: { id: loanId },
      data: {
        lender: dto.lender,
        accountName: dto.accountName,
        loanType: dto.loanType,
        isOffsetAvailable: dto.isOffsetAvailable,
      },
    });
  }

  async deleteLoan(adviserId: string, householdId: string, loanId: string) {
    await this.getHouseholdById(adviserId, householdId);
    return this.prisma.loan.update({
      where: { id: loanId },
      data: { isActive: false },
    });
  }
}
