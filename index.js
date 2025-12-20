// packages
import { PDFDocument, PDFFont, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";

// files
import json from "./data.json" with { type: "json" };

// Definitions
const pdfDoc = await PDFDocument.create();
const Courier = await pdfDoc.embedFont(StandardFonts.Courier);
const config = json.config;
const data = json.data;
const cardCount = data.length;

// functions
import returnAverageColor from "./functions/returnAverageColor.js";
import hexToRgb from "./functions/hexToRgb.js";
import doesLineFit from "./functions/doesLineFit.js";
import mmToPt from "./functions/mmToPt.js";
import ptToMm from "./functions/ptToMm.js";

// Validate all specified fonts
const fontsToValidate = ["eventFont", "attributionFont", "yearFont", "descriptionFont"];
const fonts = {};

for (const name of fontsToValidate) {
    const fontKey = config[name];
    if (!StandardFonts[fontKey]) {
        throw `The specified ${name} '${fontKey}' is not available. \nAvailable fonts: ${Object.keys(StandardFonts).join(", ")}`;
    }
    fonts[name] = await pdfDoc.embedFont(StandardFonts[fontKey]);
}

// convenience bindings used later in the file
const { eventFont, attributionFont, yearFont, descriptionFont } = fonts;

// Add a blank page to the document
const page = pdfDoc.addPage();
const { width, height } = page.getSize();

// calculate how many items will fit on a page
let spaceH = width - mmToPt(config.marginMM * 2);
let amountHorizontal = 0;

while (true) {
    const n = amountHorizontal + 1;
    const total = n * mmToPt(config.cardWidthMM) * 2 + (n - 1) * mmToPt(config.gapMM);

    if (total > spaceH) break;

    amountHorizontal = n;
}

let spaceV = height - mmToPt(config.marginMM * 2);
let amountVertical = 0;

while (true) {
    const n = amountVertical + 1;
    const total = n * mmToPt(config.cardHeightMM) + (n - 1) * mmToPt(config.gapMM);

    if (total > spaceV) break;

    amountVertical = n;
}

const pageCapacity = amountHorizontal * amountVertical;
const totalPages = Math.ceil(cardCount / pageCapacity);

// Draw a string of text toward the top of the page
const heading = "Timeline Generator";
const headingSize = 20;
const subheading = "https://github.com/thevalleyy/timeline";
const subheadingSize = 10;
const infoText = `* generated ${config.outputFile}
* start time: ${new Date().toLocaleString()}
* #cards per row: ${amountHorizontal}
* #cards per column: ${amountVertical}
* #total pages: ${totalPages}
* #total cards: ${cardCount}`;
const infoFontSize = 15;

page.drawText(heading, {
    x: (width - Courier.widthOfTextAtSize(heading, headingSize)) / 2,
    y: height - mmToPt(config.marginMM),
    size: headingSize,
    font: Courier,
    color: rgb(0, 0, 0),
});

page.drawText(subheading, {
    x: (width - Courier.widthOfTextAtSize(subheading, subheadingSize)) / 2,
    y: height - mmToPt(config.marginMM) - Courier.heightAtSize(headingSize),
    size: subheadingSize,
    font: Courier,
    color: rgb(0, 0, 0.933),
});

page.drawText(infoText, {
    x: mmToPt(config.marginMM),
    y: height - mmToPt(config.marginMM) - Courier.heightAtSize(headingSize) - Courier.heightAtSize(subheadingSize) - Courier.heightAtSize(infoFontSize) * 3,
    size: infoFontSize,
    font: Courier,
    color: rgb(0, 0, 0),
});

// draw the cards
for (let i = 0; i < cardCount; i++) {
    const card = data[i];
    let imagePath = null;
    let averageColor = null;

    if (card.image && card.image.length > 0) {
        imagePath = `./images/${card.image}`;
        if (!fs.existsSync(imagePath)) {
            throw `Image file not found: ${imagePath} for card index ${i} (${card.event})`;
        }

        averageColor = await returnAverageColor(imagePath);
    } else {
        console.warn(`No image specified for card index ${i} (${card.event}). Using default white background color.`);
        averageColor = { hex: "#FFFFFF" };
    }

    // pdf logic
    const pageIndex = Math.floor(i / pageCapacity) + 1; // there is already a page 0
    const cardIndexOnPage = i % pageCapacity;
    const row = Math.floor(cardIndexOnPage / amountHorizontal);
    const col = cardIndexOnPage % amountHorizontal;

    let currentPage;

    if (pageIndex >= pdfDoc.getPageCount()) {
        currentPage = pdfDoc.addPage();
    } else {
        currentPage = pdfDoc.getPage(pageIndex);
    }

    const x = mmToPt(config.marginMM) + col * mmToPt(config.cardWidthMM) * 2 + col * mmToPt(config.gapMM);
    const y = height - mmToPt(config.marginMM) - (row + 1) * mmToPt(config.cardHeightMM) - row * mmToPt(config.gapMM);

    // Draw card border (front)
    currentPage.drawRectangle({
        x: x,
        y: y,
        width: mmToPt(config.cardWidthMM),
        height: mmToPt(config.cardHeightMM),
        borderColor: rgb(0, 0, 0),
        color: rgb(hexToRgb(averageColor.hex)["r"], hexToRgb(averageColor.hex)["g"], hexToRgb(averageColor.hex)["b"]),
        borderWidth: 1,
    });

    // Draw event text
    const eventWords = card.event.split(" ");
    const eventWrapped = [];

    let lineIndex = 0;
    for (let j = 0; j < eventWords.length; j++) {
        let word = eventWords[j];

        // determine line to check
        const lineToCheck = eventWrapped[lineIndex] ? `${eventWrapped[lineIndex]} ${word}` : word;

        if (doesLineFit(lineToCheck, config.eventSize, eventFont)) {
            // the word fits!
            eventWrapped[lineIndex] = `${eventWrapped[lineIndex] ? `${eventWrapped[lineIndex]} ` : ""}${word}`;
        } else {
            // the word doesnt fit in the current line! test if it would fit in a new, empty line
            if (doesLineFit(word, config.eventSize, eventFont)) {
                // yes, it fits into a new line
                eventWrapped.push(word);
                lineIndex++;
            } else {
                // nope! the word is too long :c
                throw `The word '${word}' in event text '${card.event}' doesn't fit into a single line. \nConsider lowering config.eventSize. You may also seperate the word with a space to force line wrap.`;
            }
        }
    }

    for (let k = 0; k < eventWrapped.length; k++) {
        currentPage.drawText(eventWrapped[k], {
            x: x + mmToPt(config.cardWidthMM) / 2 - eventFont.widthOfTextAtSize(eventWrapped[k], config.eventSize) / 2,
            y: y + mmToPt(config.cardHeightMM) - mmToPt(config.paddingTopMM) - (k + 1) * (eventFont.heightAtSize(config.eventSize) + 2.5),
            size: config.eventSize,
            font: eventFont,
            color: averageColor.isDark ? rgb(1, 1, 1) : rgb(0, 0, 0),
        });
    }

    // TODO: draw debug rectangle for event text

    if (imagePath != null) {
        // determine max image height and width.
        const maxImageHeight =
            mmToPt(config.cardHeightMM - config.paddingTopMM - config.paddingBottomMM) -
            (eventWrapped.length + 1) * (eventFont.heightAtSize(config.eventSize) + 2.5);
        const maxImageWidth = mmToPt(config.cardWidthMM - 2 * config.paddingMM);

        if (maxImageHeight <= 0) {
            throw `Not enough vertical space for image on card ${i} (${card.event}). Consider lowering config.eventSize or increasing config.cardHeightMM.`;
        }

        if (maxImageWidth <= 0) {
            throw `Not enough horizontal space for image on card ${i} (${card.event}). Consider increasing config.cardWidthMM or reducing config.paddingMM.`;
        }

        // draw a rectangle to test image area
        if (config.debug)
            currentPage.drawRectangle({
                x: x + mmToPt(config.paddingMM),
                y: y + mmToPt(config.paddingBottomMM),
                width: maxImageWidth,
                height: maxImageHeight,
                borderColor: rgb(1, 0, 0),
                borderWidth: 0.5,
            });

        // embed the image
        const imageBytes = fs.readFileSync(imagePath);
        let embeddedImage;
        if (imagePath.toLowerCase().endsWith(".jpg") || imagePath.toLowerCase().endsWith(".jpeg")) {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else if (imagePath.toLowerCase().endsWith(".png")) {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
            throw `Unsupported image format for file: ${imagePath}. Supported formats are .jpg, .jpeg, and .png`;
        }

        // calculate image dimensions
        const { width: imgWidth, height: imgHeight } = embeddedImage.scale(1);
        let drawWidth = imgWidth;
        let drawHeight = imgHeight;

        // scale the image to fit within max dimensions
        const widthRatio = maxImageWidth / imgWidth;
        const heightRatio = maxImageHeight / imgHeight;
        const scale = Math.min(widthRatio, heightRatio, 1);

        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;

        // draw the image centered in the image area
        currentPage.drawImage(embeddedImage, {
            x: x + mmToPt(config.paddingMM) + (maxImageWidth - drawWidth) / 2,
            y: y + mmToPt(config.paddingBottomMM) + (maxImageHeight - drawHeight) / 2,
            width: drawWidth,
            height: drawHeight,
        });

        // copyright string
        const atrWords = card.attribution.split(" "); // TODO: wrap from bottom up
        const atrWrapped = [];

        let lineIndex = 0;
        for (let j = 0; j < atrWords.length; j++) {
            let word = atrWords[j];

            // determine line to check
            const lineToCheck = atrWrapped[lineIndex] ? `${atrWrapped[lineIndex]} ${word}` : word;

            if (doesLineFit(lineToCheck, config.attributionSize, attributionFont)) {
                // the word fits!
                atrWrapped[lineIndex] = `${atrWrapped[lineIndex] ? `${atrWrapped[lineIndex]} ` : ""}${word}`;
            } else {
                // the word doesnt fit in the current line! test if it would fit in a new, empty line
                if (doesLineFit(word, config.attributionSize, attributionFont)) {
                    // yes, it fits into a new line
                    atrWrapped.push(word);
                    lineIndex++;
                } else {
                    // nope! the word is too long :c
                    throw `The word '${word}' in attribution text '${card.attribution}' doesn't fit into a single line. \nConsider lowering config.attributionSize. You may also seperate the word with a space to force line wrap.`;
                }
            }
        }

        // is there enough space for attribution?
        if (attributionFont.heightAtSize(config.attributionSize) * atrWrapped.length > maxImageHeight) {
            throw `Not enough space for attribution text on card ${i} (${card.event}). Consider lowering config.attributionSize or increasing config.cardHeightMM.`;
        }

        for (let k = 0; k < atrWrapped.length; k++) {
            currentPage.drawText(atrWrapped[k], {
                x: x + mmToPt(config.paddingMM),
                y: y + mmToPt(config.paddingBottomMM) + (atrWrapped.length - k - 1) * (attributionFont.heightAtSize(config.attributionSize) + 1) + 2,
                size: config.attributionSize,
                font: attributionFont,
                color: averageColor.isDark ? rgb(1, 1, 1) : rgb(0, 0, 0),
            });
        }
    }

    // draw card border (back)
    currentPage.drawRectangle({
        x: x + mmToPt(config.cardWidthMM),
        y: y,
        width: mmToPt(config.cardWidthMM),
        height: mmToPt(config.cardHeightMM),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
    });

    // draw year text
    currentPage.drawText(card.year, {
        x: x + mmToPt(config.cardWidthMM) + mmToPt(config.cardWidthMM) / 2 - yearFont.widthOfTextAtSize(card.year, config.yearSize) / 2,
        y: y + mmToPt(config.cardHeightMM) - mmToPt(config.paddingTopMM) - yearFont.heightAtSize(config.yearSize),
        size: config.yearSize,
        font: yearFont,
        color: averageColor.isDark ? rgb(0, 0, 0) : rgb(0, 0, 0), // TODO: color choice
    });

    if (config.debug)
        currentPage.drawRectangle({
            x: x + mmToPt(config.cardWidthMM) + mmToPt(config.paddingMM),
            y: y + mmToPt(config.cardHeightMM) - mmToPt(config.paddingTopMM) - yearFont.heightAtSize(config.yearSize),
            width: mmToPt(config.cardWidthMM - 2 * config.paddingMM),
            height: yearFont.heightAtSize(config.yearSize),
            borderColor: rgb(0, 1, 0),
            borderWidth: 0.5,
        });

    const maxDescHeight =
        mmToPt(config.cardHeightMM - config.paddingTopMM - config.paddingBottomMM) -
        yearFont.heightAtSize(config.yearSize) -
        2 * descriptionFont.heightAtSize(config.descriptionSize);
    const maxDescWidth = mmToPt(config.cardWidthMM - 2 * config.paddingMM);

    if (maxDescHeight <= 0) {
        throw `Not enough vertical space left for description on card ${i} (${card.event}). Consider lowering config.year or increasing config.cardHeightMM.`;
    }

    if (maxDescWidth <= 0) {
        throw `Not enough horizontal space left for description on card ${i} (${card.event}). Consider increasing config.cardWidthMM or reducing config.paddingMM.`;
    }

    if (config.debug)
        currentPage.drawRectangle({
            x: x + mmToPt(config.paddingMM) + mmToPt(config.cardWidthMM),
            y: y + mmToPt(config.paddingBottomMM),
            width: maxDescWidth,
            height: maxDescHeight,
            borderColor: rgb(1, 0, 0),
            borderWidth: 0.5,
        });

    // Draw description text
    currentPage.drawText(card.description, {
        x: x + mmToPt(config.cardWidthMM) + mmToPt(config.paddingMM),
        y: y + maxDescHeight + mmToPt(config.paddingBottomMM) - descriptionFont.heightAtSize(config.descriptionSize),
        size: config.descriptionSize,
        font: descriptionFont,
        lineHeight: descriptionFont.heightAtSize(config.descriptionSize) + 2,
        maxWidth: maxDescWidth,
        color: averageColor.isDark ? rgb(0, 0, 0) : rgb(0, 0, 0), // TODO: color choice
    });
}

// Serialize the PDFDocument to bytes (a Uint8Array)
const pdfBytes = await pdfDoc.save();

// Write the PDF to a file
fs.writeFileSync(config.outputFile, pdfBytes);
