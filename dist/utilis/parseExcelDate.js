"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExcelDate = parseExcelDate;
function parseExcelDate(excelSerial) {
    if (!excelSerial)
        return null;
    const excelSerialFloat = parseFloat(excelSerial);
    // Excel's base date is January 1, 1900
    const excelBaseDate = new Date(1899, 11, 30); // Dec 30, 1899
    // Calculate the date by adding the serial number as days
    const jsDate = new Date(excelBaseDate.getTime() + excelSerialFloat * 86400000);
    return jsDate;
}
//# sourceMappingURL=parseExcelDate.js.map