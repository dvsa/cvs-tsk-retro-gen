declare enum StationType {
  ATF = "atf",
  GVTS = "gvts",
  HQ = "hq",
}

interface ISPConfig {
  azure_sharepoint_client_id: string;
  azure_sharepoint_client_secret: string;
  azure_sharepoint_tenant_id: string;
  sharepoint_site_collection: string;
  sharepoint_drive_id: string;
  sharepoint_parent_id: string;
}

interface IActivity {
  id: string;
  activityType: "visit" | "wait";
  testStationName: string;
  testStationPNumber: string;
  testStationEmail: string;
  testStationType: StationType;
  testerName: string;
  testerStaffId: string;
  startTime: string;
  endTime: string;
  waitReason: [string];
  notes: string;
}

export interface ITestType {
  prohibitionIssued: boolean;
  testCode?: string; // Not sent from FE, calculated in the BE.
  testNumber: string | null; // Not sent from FE, calculated in the BE.
  lastUpdatedAt: string | Date;
  testAnniversaryDate: string | Date | null; // Not sent from FE, calculated in the BE.
  additionalCommentsForAbandon: string | null;
  numberOfSeatbeltsFitted?: number | null; // mandatory for PSV only, not applicable for HGV and TRL
  testTypeEndTimestamp: string | Date;
  reasonForAbandoning: string | null;
  lastSeatbeltInstallationCheckDate?: string | Date | null; // mandatory for PSV only, not applicable for HGV and TRL
  createdAt: string | Date | null;
  testTypeId: string;
  testTypeStartTimestamp: string | Date;
  testTypeName: string;
  seatbeltInstallationCheckDate?: boolean | null; // mandatory for PSV only, not applicable for HGV and TRL
  additionalNotesRecorded: string;
  defects: IDefect[];
  customDefects: ICustomDefect[];
  name: string;
  certificateLink?: string | null; // Not sent from FE, calculated in the BE.
  testTypeClassification?: string; // field not present in API specs and is removed during POST but present in all json objects
  testResult: string;
  certificateNumber?: string | null;
  testExpiryDate?: string | Date; // Sent form FE only for LEC tests. For the rest of the test types it is not sent from FE, and calculated in the BE.
  deletionFlag?: boolean | null; // Not sent from FE, calculated in the BE.

  // Used only for LEC tests.
  modType?: IModType | null;
  particulateTrapSerialNumber?: string | null;
  smokeTestKLimitApplied?: string | null;
  emissionStandard?: string | null;
  modificationTypeUsed?: string | null;
  particulateTrapFitted?: string | null;
  fuelType?: string | null;
}

export interface ICustomDefect {
  referenceNumber: string;
  defectName: string;
  defectNotes: string;
}

export interface IDefect {
  deficiencyCategory: string;
  deficiencyText: string | null;
  prs: boolean | null;
  additionalInformation: IAdditionalInformation;
  itemNumber: number;
  deficiencyRef: string;
  stdForProhibition: boolean | null;
  deficiencySubId: string | null;
  imDescription: string;
  deficiencyId: string;
  itemDescription: string;
  imNumber: number;
  prohibitionIssued?: boolean;
}

export interface IAdditionalInformation {
  location: Location | null;
  notes: string;
}

export interface IModType {
  code: string;
  description: string;
}

interface ITestResults {
  testerStaffId: string;
  vrm: string;
  testStationPNumber: string;
  preparerId: string;
  numberOfSeats: number;
  testStartTimestamp: string;
  testEndTimestamp: string;
  testTypes: ITestType;
  vin: string;
  vehicleType: string;
}

interface IActivitiesList {
  startTime: string;
  activityType: string;
  activity: any;
}

interface IInvokeConfig {
  params: { apiVersion: string; endpoint?: string };
  functions: { testResults: { name: string }; techRecords: { name: string; mock: string }; getActivities: { name: string } };
}

export { ISPConfig, IActivity, IInvokeConfig, ITestResults, IActivitiesList };
