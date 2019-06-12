import {describe} from "mocha";
import {RetroGenerationService} from "../../src/services/RetroGenerationService";
import {LambdaService} from "../../src/services/LambdaService";
import * as Excel from "exceljs";
import {TestResultsService} from "../../src/services/TestResultsService";
import Lambda = require("aws-sdk/clients/lambda");
import {expect} from "chai";


describe("RetroGenerationService", () => {
    context("adjustStaticTemplateForMoreThan11Tests", () => {
        it("", async () => {
            const retroGenerationService = new RetroGenerationService(new TestResultsService(new LambdaService(new Lambda())));
            retroGenerationService.fetchRetroTemplate(15)
                .then((template: { workbook: Excel.Workbook, reportTemplate: any}) => {
                    retroGenerationService.adjustStaticTemplateForMoreThan11Tests(template, 15);
                    retroGenerationService.correctTemplateAfterAdjustment(template, 15);
                    const worksheet = template.workbook.getWorksheet(1);
                    expect(worksheet.getCell("B28").border).to.not.eql(undefined);
                    expect(worksheet.getCell("G31").border).to.not.eql(undefined);
                    expect(worksheet.getCell("G13").border.right).to.not.eql(undefined);
                    expect(worksheet.getCell("G39").border.right).to.not.eql(undefined);
                    expect(worksheet.getCell("G35").master).to.eql(worksheet.getCell("E35"));
                    expect(worksheet.getCell("F35").master).to.eql(worksheet.getCell("E35"));
                    expect(worksheet.getCell("G39").master).to.eql(worksheet.getCell("F39"));
                });
        });
    });
});
