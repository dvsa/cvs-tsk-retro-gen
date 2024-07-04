declare enum StationType {
  ATF = "atf",
  GVTS = "gvts",
  HQ = "hq",
  POTF = "potf",
}

interface ISPConfig {
  azure_sharepoint_client_id: string;
  azure_sharepoint_client_secret: string;
  azure_sharepoint_tenant_id: string;
  sharepoint_site_collection: string;
  sharepoint_drive_id: string;
  sharepoint_parent_id: string;
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

export { ISPConfig, IInvokeConfig, IActivitiesList };
