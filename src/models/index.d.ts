declare enum StationType {
    ATF = "atf",
    GVTS = "gvts",
    HQ = "hq"
}

interface ISPConfig {
    azure_sharepoint_client_id: string;
    azure_sharepoint_client_secret: string;
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
}

interface IInvokeConfig {
    params: { apiVersion: string; endpoint?: string; };
    functions: { testResults: { name: string }, techRecords: { name: string; mock: string } };
}

export {ISPConfig, IActivity, IInvokeConfig};
