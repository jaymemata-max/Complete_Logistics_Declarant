// ─────────────────────────────────────────────────────────────
// Core declaration types
// ─────────────────────────────────────────────────────────────

export type DeclarationStatus = 'DRAFT' | 'SUBMITTED' | 'REGISTERED' | 'REJECTED';
export type ShipmentType = 'LCL' | 'FCL' | 'Air' | 'Alcohol';

export interface Declaration {
  id: string;
  status: DeclarationStatus;
  shipmentType: ShipmentType;
  createdBy?: string;
  submittedAt?: Date;
  registeredAt?: Date;
  customsReferenceNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
  header: DeclarationHeader;
  items: DeclarationItem[];
  containers: DeclarationContainer[];
  vehicles: DeclarationVehicle[];
}

export interface DeclarationHeader {
  declarationId: string;
  shipmentType: ShipmentType;
  typeOfDeclaration: string;
  generalProcedureCode: string;
  manifestReferenceNumber: string;
  totalNumberOfPackages: number;
  customsClearanceOfficeCode: string;
  consigneeCode: string;
  consigneeName: string;
  declarantCode: string;
  declarantName: string;
  referenceYear: string;
  referenceNumber: string;
  countryFirstDestination: string;
  tradingCountry: string;
  exportCountryCode: string;
  destinationCountryCode: string;
  containerFlag: boolean;
  locationOfGoods: string;                // Field 30  — XML: <Location_of_goods>
  locationOfGoodsAddress: string;         // Field 30a — XML: <Location_of_goods_address> max 60 chars
  transportIdentity: string;
  transportNationality: string;
  borderTransportIdentity: string;
  borderTransportNationality: string;
  borderTransportMode: string;
  deliveryTermsCode: string;
  deliveryTermsPlace: string;
  borderOfficeCode: string;
  placeOfLoadingCode: string;
  deferredPaymentReference: string;
  financialTransactionCode1: string;
  financialTransactionCode2: string;
  warehouseIdentification: string;        // Field 49
  invoiceAmount: number;
  invoiceCurrencyCode: string;
  externalFreightAmount: number;
  externalFreightCurrencyCode: string;
  insuranceAmount: number;
  insuranceCurrencyCode: string;
  otherCostAmount: number;
  otherCostCurrencyCode: string;
  deductionAmount: number;
  deductionCurrencyCode: string;
  grossWeight: number;
  calculationWorkingMode: 0 | 1 | 2;     // 0=per value, 1=per weight, 2=no apportionment
  splitsFlag: boolean;
}

export interface DeclarationItem {
  id: string;
  itemNumber: number;
  tradeNameSearch: string;
  hsCode: string;
  commercialDescription: string;
  descriptionOfGoods: string;
  countryOfOriginCode: string;
  numberOfPackages: number;
  kindOfPackagesCode: string;
  marks1: string;
  marks2: string;
  invoiceAmount: number;
  invoiceCurrencyCode: string;
  grossWeight: number;
  netWeight: number;
  extendedCustomsProcedure: string;
  nationalCustomsProcedure: string;
  preferenceCode: string;                 // Field 36 — XML: <Preference_code>
  valuationMethodCode: string;            // Field 43
  quotaNumber: string;                    // Field 39 — XML: <Quota_code>
  previousDocumentSummaryDeclaration: string;
  previousDocumentSummaryDeclarationSubline: string;
  supplementaryUnits: SupplementaryUnit[];   // Field 41
  attachedDocuments: AttachedDocument[];     // Field 44
}

// Field 41 — Aanvullende eenheden
// XML: <Items>/<Item>/<Tariff>/<Supplementary_unit>
export interface SupplementaryUnit {
  id: string;
  rank: number;
  code: string;     // Supplementary_unit_code AN3 — broker types freely
  quantity: number; // Supplementary_unit_quantity
}

// Field 44 — Bijzondere vermeldingen
// XML: <Items>/<Item>/<Attached_documents>/<Attached_document>
// All fields are free text — no fixed code list (confirmed from ASYCUDA SAD XML spec)
export interface AttachedDocument {
  id: string;
  documentCode: string;       // Attached_document_code AN4
  documentName: string;       // Attached_document_name AN70
  referenceNumber: string;    // Attached_document_reference AN30
  documentDate?: string;      // Attached_document_date DATE (ISO string)
}

// Feature 4 — Vehicle declarations
// One vehicle per declaration item (Q3 answer: each VIN = own item)
export interface DeclarationVehicle {
  id: string;
  itemId: string;           // FK → DeclarationItem.id
  vinNumber: string;
  stockNumber: string;
  make: string;
  model: string;
  year: string;
  color: string;
  engineType: string;
  engineNumber: string;
  fuelType: 'G' | 'D' | 'E' | 'H' | 'O' | '';  // Gasoline/Diesel/Electric/Hybrid/Other
  transmission: 'A' | 'M' | '';                  // Automatic/Manual
  invoiceValue: number;
  invoiceCurrency: string;
  grossWeight: number;
  netWeight: number;
}

export interface DeclarationContainer {
  id: string;
  itemNumber: number;
  containerNumber: string;
  containerType: string;
  emptyFullIndicator: string;
  goodsDescription: string;
  packagesType: string;
  packagesNumber: number;
  packagesWeight: number;
}

// ─────────────────────────────────────────────────────────────
// Reference table types (from Supabase lookups)
// ─────────────────────────────────────────────────────────────

export interface Importer {
  id: string;
  asycudaCode: string;
  name: string;
  address1?: string;
  address2?: string;
  address3?: string;
  defaultDutyTerms?: string;
  email?: string;
  phone?: string;
}

export interface Vessel {
  id: string;
  name: string;
  nationality: string;
  imoNumber?: string;
  typicalVoyageFrom?: string;
  notes?: string;
}

export interface CpcCode {
  id: string;
  code: string;
  extended: string;
  national: string;
  type: string;
  description: string;
}

export interface CommodityMasterRecord {
  id: string;
  keyword: string;
  hsCode: string;
  commercialDescription: string;
  goodsDescription: string;
  marks1: string;
  packageCode: string;
  suppUnitCode?: string;
}

export interface Template {
  id: string;
  code: string;
  description: string;
  isShared: boolean;
  headerSnapshot: DeclarationHeader;
}
