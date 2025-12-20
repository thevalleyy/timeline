import { PDFFont } from "pdf-lib";
import doesLineFit from "./doesLineFit.js";

/**
 * This function breaks text into several lines to ensure it fits into a textbox
 * @param {String} text The text to wrap
 * @param {String} origin The json key of the text
 * @param {Number} fontSize The font size
 * @param {PDFFont} fontType The font type
 * @returns An array where every element fits in a line
 */
export default function wrapWords(text, origin, fontSize, fontType) {
    const words = text.split(" ");
    const wrapped = [];

    let lineIndex = 0;
    for (let i = 0; i < words.length; i++) {
        // iterate through all words

        const word = words[i];
        const lineToCheck = wrapped[lineIndex] ? `${wrapped[lineIndex]} ${word}` : word;

        if (doesLineFit(lineToCheck, fontSize, fontType)) {
            // the word fits!

            wrapped[lineIndex] = `${wrapped[lineIndex] ? `${wrapped[lineIndex]} ` : ""}${word}`;
        } else {
            // the word doesn't fit in the current line! test if it would fit in a new one
            if (doesLineFit(word, fontSize, fontType)) {
                // yes, it fits into a new line
                wrapped.push(word);
                lineIndex++;
            } else {
                // nope! the word is too long :c
                throw `The word '${word}' in ${origin} doesn't fit into a single line. \nConsider lowering the fontsize (in data.json). \nYou may also seperate the word with a space to force line wrap.`;
            }
        }
    }

    return wrapped;
}
