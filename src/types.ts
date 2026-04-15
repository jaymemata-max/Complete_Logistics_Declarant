export interface Declaration {
  id: string;
  header: DeclarationHeader;
  items: DeclarationItem[];
  containers: DeclarationContainer[];
}

export interface DeclarationHeader {
  declarationId: string;
  shipmentType: 'LCL' | 'FCL' | 'Air' | 'Alcohol';
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
  locationOfGoods: string;
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
  warehouseIdentification: string;
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
  factor: number;
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
  valuationMethodCode: string;
  previousDocumentSummaryDeclaration: string;
  previousDocumentSummaryDeclarationSubline: string;
  supplementaryUnits: SupplementaryUnit[];
}

export interface SupplementaryUnit {
  id: string;
  rank: number;
  code: string;
  quantity: number;
}

export interface DeclarationContainer {
  id: string;
  containerNumber: string;
  containerType: string;
  emptyFullIndicator: string;
  linkedItemNumbers: number[];
  goodsDescription: string;
  packagesType: string;
  packagesNumber: number;
  packagesWeight: number;
}
