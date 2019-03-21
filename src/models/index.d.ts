declare enum StationType {
    ATF = "atf",
    GVTS = "gvts",
    HQ = "hq"
}

interface IS3Config {
    endpoint: string;
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

export {IS3Config, IActivity, IInvokeConfig};
