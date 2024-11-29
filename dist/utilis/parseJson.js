"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parseJson;
function parseJson(input) {
    try {
        return { isJson: true, value: JSON.parse(input) };
    }
    catch (error) {
        return { isJson: false, value: input };
    }
}
//# sourceMappingURL=parseJson.js.map