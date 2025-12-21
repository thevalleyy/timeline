import mmToPt from "./mmToPt.js";
import json from "../data.json" with { type: "json" };
const { config } = json;

/**
 * Test if a line fits within the card width
 * @param {String} line The line to test the width of
 * @param {Number} fontSize The fontsize
 * @param {PDFFont} font The font
 * @returns {Boolean} True if the line fits, false otherwise
 */
export default function doesLineFit(line, fontSize, font) {
    // console.log(line, eventFont.widthOfTextAtSize(line, config.eventSize), mmToPt(config.cardWidthMM - 2 * config.paddingMM));
    return (
        font.widthOfTextAtSize(line.replaceAll("**", "").replaceAll("__", "").replaceAll("~~", ""), fontSize) <=
        mmToPt(config.cardWidthMM - 2 * config.paddingMM)
    );
}
