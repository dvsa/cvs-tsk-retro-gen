import {IActivity} from "../models";
import * as Excel from "exceljs";
import * as path from "path";
import {Service} from "../models/injector/ServiceDecorator";
import {TestResultsService} from "./TestResultsService";
import moment = require("moment");
import {ActivityType} from "../models/enums";

@Service()
class RetroGenerationService {
    private readonly testResultsService: TestResultsService;

    constructor(testResultsService: TestResultsService) {
        this.testResultsService = testResultsService;
    }

    /**
     * Generates the ATF report for a given activity
     * @param activity - activity for which to generate the report
     */
    public generateRetroReport(activity: IActivity): Promise<any> {
        return this.testResultsService.getTestResults({
            testerStaffId: activity.testerStaffId,
            fromDateTime: activity.startTime,
            toDateTime: activity.endTime,
            testStationPNumber: activity.testStationPNumber
        }).then((testResults: any) => {
            // Fetch and populate the ATF template
            return this.fetchRetroTemplate(testResults.length)
            .then((template: { workbook: Excel.Workbook, reportTemplate: any} ) => {
                const siteVisitDetails: any = template.reportTemplate.siteVisitDetails;

                // Populate site visit details
                siteVisitDetails.assesor.value = activity.testerName;
                siteVisitDetails.siteName.value = activity.testStationName;
                siteVisitDetails.siteNumber.value = activity.testStationPNumber;
                siteVisitDetails.date.value = moment(activity.startTime).format("DD/MM/YYYY");
                siteVisitDetails.startTime.value = moment(activity.startTime).format("HH:mm:ss");
                siteVisitDetails.endTime.value = moment(activity.endTime).format("HH:mm:ss");
                siteVisitDetails.endDate.value = moment(activity.endTime).format("DD/MM/YYYY");

                // Populate activity report
                for (let i = 0, j = 0; i < template.reportTemplate.activityDetails.length && j < testResults.length; i++, j++) {
                    const detailsTemplate: any = template.reportTemplate.activityDetails[i];
                    const testResult: any = testResults[j];
                    const testType: any = testResult.testTypes;

                    detailsTemplate.activity.value = (activity.activityType === "visit") ? ActivityType.TEST : ActivityType.WAIT_TIME;
                    detailsTemplate.startTime.value = moment(testResult.testStartTimestamp).format("HH:mm:ss");
                    detailsTemplate.finishTime.value = moment(testResult.testEndTimestamp).format("HH:mm:ss");
                    detailsTemplate.vrm.value = testResult.vrm;
                    detailsTemplate.chassisNumber.value = testResult.vin;
                    detailsTemplate.testType.value = testType.testCode;
                    detailsTemplate.seatsAndAxles.value = (testResult.vehicleType === "psv") ? testResult.numberOfSeats : "" ;
                    detailsTemplate.result.value = testType.testResult;
                    detailsTemplate.certificateNumber.value = testType.certificateNumber;
                    detailsTemplate.expiryDate.value = moment(testType.testExpiryDate).format("DD/MM/YYYY");
                    detailsTemplate.preparerId.value = testResult.preparerId;
                    detailsTemplate.failutreAdvisoryItemsQAIComments.value = testType.reasonForAbandoning;

                }

                return template.workbook.xlsx.writeBuffer()
                .then((buffer: Excel.Buffer) => {
                    return {
                        fileName: `ATFReport_${moment(activity.startTime).format("DD-MM-YYYY")}_${moment(activity.startTime).format("HHmm")}_${activity.testStationPNumber}_${activity.testerName}.xlsx`,
                        fileBuffer: buffer
                    };
                });
            });
        });
    }

    /**
     * Create a template of excel cell locations for inserting expected values in the correct place
     * @param totalActivities - the total number of activities that will be displayed.
     * this is used for determining how many rows the table will have
     */
    public fetchRetroTemplate(totalActivities: number) {
        const workbook = new Excel.Workbook();
        return workbook.xlsx.readFile(path.resolve(__dirname, "../resources/retro_report_template.xlsx"))
        .then((template: Excel.Workbook) => {
            // Index starts at 1
            const reportSheet: Excel.Worksheet = template.getWorksheet(1);

            // Change file metadata
            template.creator = "Commercial Vehicles Services Beta Team";
            // @ts-ignore
            template.company = "Drivers and Vehicles Standards Agency";
            reportSheet.name = "Retrokey report";
            delete template.lastModifiedBy;

            // Map values
            const atfReportTemplate: any = {
                siteVisitDetails: {
                    assesor: reportSheet.getCell("C4"),
                    siteName: reportSheet.getCell("F4"),
                    siteNumber: reportSheet.getCell("F5"),
                    date: reportSheet.getCell("F6"),
                    startTime: reportSheet.getCell("C6"),
                    endTime: reportSheet.getCell("C7"),
                    endDate: reportSheet.getCell("F7"),
                },
                activityDetails: Array.from({ length: totalActivities }, (v, k) => {
                    return {
                        activity: reportSheet.getCell(`B${17 + k}`),
                        startTime: reportSheet.getCell(`C${17 + k}`),
                        finishTime: reportSheet.getCell(`D${17 + k}`),
                        vrm: reportSheet.getCell(`E${17 + k}`),
                        chassisNumber: reportSheet.getCell(`F${17 + k}`),
                        testType: reportSheet.getCell(`G${17 + k}`),
                        seatsAndAxles: reportSheet.getCell(`H${17 + k}`),
                        result: reportSheet.getCell(`I${17 + k}`),
                        certificateNumber: reportSheet.getCell(`J${17 + k}`),
                        expiryDate: reportSheet.getCell(`K${17 + k}`),
                        preparerId: reportSheet.getCell(`L${17 + k}`),
                        failutreAdvisoryItemsQAIComments: reportSheet.getCell(`M${17 + k}`),
                    };
                })

            };

            reportSheet.getCell("G4").alignment = { wrapText: true };
            reportSheet.getCell("M16").alignment = { wrapText: true };

            const cellsWithBorders = ["G13", "G30", "G31", "G34", "G35", "M16"];

            this.addBorders(cellsWithBorders, reportSheet);


            Object.values(atfReportTemplate.siteVisitDetails).forEach((cell: any) => {
                this.addCellStyle(cell);
            });

            Object.values(atfReportTemplate.activityDetails).forEach((cell: any) => {
                this.addCellStyle(cell);
            });

            atfReportTemplate.activityDetails.forEach((detailsTemplate: any) => {
                Object.values(detailsTemplate).forEach((cell: any) => {
                    this.addCellStyle(cell);
                });
            });

            return {
                workbook,
                reportTemplate: atfReportTemplate
            };
        });
    }

    /**
     * Adds styling to a given cell
     * @param cell - the cell to add style to
     */
    private addBorders(cells: string[], reportSheet: Excel.Worksheet) {
        cells.forEach((cell) => {
            reportSheet.getCell(cell).border = {
                right: { style: "medium" },
                left: { style: "medium" },
                top: { style: "medium" },
                bottom: { style: "medium" }
            };
        });
        return reportSheet;
    }

    /**
     * Add Cell style
     * @param cell
     */
    private addCellStyle(cell: any) {
        cell.border = {
            right: { style: "medium" },
            left: { style: "medium" },
            top: { style: "medium" },
            bottom: { style: "medium" }
        };

        cell.alignment = { horizontal: "left" };
    }

}

export {RetroGenerationService};
