declare enum StationType {
  ATF = "atf",
  GVTS = "gvts",
  HQ = "hq",
  POTF = "potf"
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

interface ITestType {
  testTypeStartTimestamp: string;
  testTypeName: string;
  testResult: string;
  certificateNumber: string;
  testExpiryDate: number;
  testTypeEndTimeStamp: string;
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

export { ISPConfig, IActivity, IInvokeConfig, ITestType, ITestResults, IActivitiesList };
