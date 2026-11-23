import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { UpdateHouseholdDto } from './dto/update-household.dto';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';
import { CreateEntityDto, UpdateEntityDto } from './dto/entity.dto';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';
import { CreateLoanDto, UpdateLoanDto } from './dto/loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Clients & Households')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Get aggregated dashboard metrics (households, loans, review statuses) from DB' })
  getDashboardSummary(@CurrentUser('id') adviserId: string) {
    return this.clientsService.getDashboardSummary(adviserId);
  }

  // Households
  @Post()
  @ApiOperation({ summary: 'Create a new client household' })
  createHousehold(
    @CurrentUser('id') adviserId: string,
    @Body() dto: CreateHouseholdDto,
  ) {
    return this.clientsService.createHousehold(adviserId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active client households for logged-in adviser' })
  listHouseholds(@CurrentUser('id') adviserId: string) {
    return this.clientsService.listHouseholds(adviserId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get household details with full nested structure' })
  getHousehold(
    @CurrentUser('id') adviserId: string,
    @Param('id') id: string,
  ) {
    return this.clientsService.getHouseholdById(adviserId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client household details' })
  updateHousehold(
    @CurrentUser('id') adviserId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHouseholdDto,
  ) {
    return this.clientsService.updateHousehold(adviserId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a client household' })
  archiveHousehold(
    @CurrentUser('id') adviserId: string,
    @Param('id') id: string,
  ) {
    return this.clientsService.archiveHousehold(adviserId, id);
  }

  // Members (Persons)
  @Post(':id/members')
  @ApiOperation({ summary: 'Add a person to household' })
  addPerson(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Body() dto: CreatePersonDto,
  ) {
    return this.clientsService.addPerson(adviserId, householdId, dto);
  }

  @Patch(':id/members/:personId')
  @ApiOperation({ summary: 'Update person details in household' })
  updatePerson(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('personId') personId: string,
    @Body() dto: UpdatePersonDto,
  ) {
    return this.clientsService.updatePerson(adviserId, householdId, personId, dto);
  }

  @Delete(':id/members/:personId')
  @ApiOperation({ summary: 'Remove a person from household' })
  deletePerson(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('personId') personId: string,
  ) {
    return this.clientsService.deletePerson(adviserId, householdId, personId);
  }

  // Entities
  @Post(':id/entities')
  @ApiOperation({ summary: 'Add an ownership entity / client to household' })
  addEntity(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Body() dto: CreateEntityDto,
  ) {
    return this.clientsService.addEntity(adviserId, householdId, dto);
  }

  @Patch(':id/entities/:entityId')
  @ApiOperation({ summary: 'Update an ownership entity' })
  updateEntity(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('entityId') entityId: string,
    @Body() dto: UpdateEntityDto,
  ) {
    return this.clientsService.updateEntity(adviserId, householdId, entityId, dto);
  }

  @Delete(':id/entities/:entityId')
  @ApiOperation({ summary: 'Delete an ownership entity' })
  deleteEntity(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('entityId') entityId: string,
  ) {
    return this.clientsService.deleteEntity(adviserId, householdId, entityId);
  }

  // Properties
  @Post(':id/properties')
  @ApiOperation({ summary: 'Add a property (Investment or Owner-Occupied) to household' })
  addProperty(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.clientsService.addProperty(adviserId, householdId, dto);
  }

  @Patch(':id/properties/:propertyId')
  @ApiOperation({ summary: 'Update property details' })
  updateProperty(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('propertyId') propertyId: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.clientsService.updateProperty(adviserId, householdId, propertyId, dto);
  }

  @Delete(':id/properties/:propertyId')
  @ApiOperation({ summary: 'Deactivate a property' })
  deleteProperty(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.clientsService.deleteProperty(adviserId, householdId, propertyId);
  }

  // Household-level Loan creation (resolves property by propertyId or security1 address)
  @Post(':id/loans')
  @ApiOperation({ summary: 'Add a loan facility to a household' })
  addHouseholdLoan(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Body() dto: CreateLoanDto,
  ) {
    return this.clientsService.addHouseholdLoan(adviserId, householdId, dto);
  }

  @Patch(':id/loans/:loanId')
  @ApiOperation({ summary: 'Update loan facility details at household level' })
  updateHouseholdLoan(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('loanId') loanId: string,
    @Body() dto: UpdateLoanDto,
  ) {
    return this.clientsService.updateLoan(adviserId, householdId, loanId, dto);
  }

  @Delete(':id/loans/:loanId')
  @ApiOperation({ summary: 'Deactivate a loan facility at household level' })
  deleteHouseholdLoan(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('loanId') loanId: string,
  ) {
    return this.clientsService.deleteLoan(adviserId, householdId, loanId);
  }

  // Property-nested Loans
  @Post(':id/properties/:propertyId/loans')
  @ApiOperation({ summary: 'Add a loan facility to a property' })
  addLoan(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateLoanDto,
  ) {
    return this.clientsService.addLoan(adviserId, householdId, propertyId, dto);
  }

  @Patch(':id/properties/:propertyId/loans/:loanId')
  @ApiOperation({ summary: 'Update loan facility details' })
  updateLoan(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('loanId') loanId: string,
    @Body() dto: UpdateLoanDto,
  ) {
    return this.clientsService.updateLoan(adviserId, householdId, loanId, dto);
  }

  @Delete(':id/properties/:propertyId/loans/:loanId')
  @ApiOperation({ summary: 'Deactivate a loan facility' })
  deleteLoan(
    @CurrentUser('id') adviserId: string,
    @Param('id') householdId: string,
    @Param('loanId') loanId: string,
  ) {
    return this.clientsService.deleteLoan(adviserId, householdId, loanId);
  }
}
