import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";
import json from "./data.json" with { type: "json" };

// Definitions
const pdfDoc = await PDFDocument.create();
const Courier = await pdfDoc.embedFont(StandardFonts.Courier);
const config = json.config;
const data = json.data;
const cardCount = data.length;

// oneliners
const mmToPt = (mm) => mm * 2.834645669;
const ptToMm = (pt) => pt / 2.834645669;

// Add a blank page to the document
const page = pdfDoc.addPage();
const { width, height } = page.getSize();

// calculate how many items will fit on a page
let spaceH = width - mmToPt(config.marginMM * 2);
let amountHorizontal = 0;

while (true) {
    const n = amountHorizontal + 1;
    const total =
        n * mmToPt(config.cardWidthMM) * 2 + (n - 1) * mmToPt(config.gapMM);

    if (total > spaceH) break;

    amountHorizontal = n;
}

let spaceV = height - mmToPt(config.marginMM * 2);
let amountVertical = 0;

while (true) {
    const n = amountVertical + 1;
    const total =
        n * mmToPt(config.cardHeightMM) + (n - 1) * mmToPt(config.gapMM);

    if (total > spaceV) break;

    amountVertical = n;
}

const pageCapacity = amountHorizontal * amountVertical;
const totalPages = Math.ceil(cardCount / pageCapacity);

// Draw a string of text toward the top of the page
const heading = "Timeline Generator";
page.drawText(heading, {
    x: (width - Courier.widthOfTextAtSize(heading, 20)) / 2,
    y: height - mmToPt(config.marginMM) - 15,
    size: 20,
    font: Courier,
    color: rgb(0, 0, 0),
});

const fontSize = 15;
const text = `* Generated PDF with ${cardCount} cards
* Cards per row: ${amountHorizontal}
* Cards per column: ${amountVertical}
* Total pages: ${totalPages}`;

page.drawText(text, {
    x: mmToPt(config.marginMM) + 2 * fontSize,
    y: height - mmToPt(config.marginMM) - 4 * fontSize,
    size: fontSize,
    font: Courier,
    color: rgb(0, 0, 0),
});

// draw the cards
for (let i = 0; i < cardCount; i++) {
    const card = data[i];
    const pageIndex = Math.floor(i / pageCapacity) + 1; // there is already a page 0
    const cardIndexOnPage = i % pageCapacity;
    const row = Math.floor(cardIndexOnPage / amountHorizontal);
    const col = cardIndexOnPage % amountHorizontal;

    let currentPage;
    if (pageIndex === 0) {
        currentPage = page;
    } else {
        if (pageIndex >= pdfDoc.getPageCount()) {
            currentPage = pdfDoc.addPage();
        } else {
            currentPage = pdfDoc.getPage(pageIndex);
        }
    }

    const x =
        mmToPt(config.marginMM) +
        col * mmToPt(config.cardWidthMM) * 2 +
        col * mmToPt(config.gapMM);
    const y =
        height -
        mmToPt(config.marginMM) -
        (row + 1) * mmToPt(config.cardHeightMM) -
        row * mmToPt(config.gapMM);

    // Draw card border (front)
    currentPage.drawRectangle({
        x: x,
        y: y,
        width: mmToPt(config.cardWidthMM),
        height: mmToPt(config.cardHeightMM),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
    });

    // Draw card text
    const cardText = `${card.time}\n\n${card.event}`;
    currentPage.drawText(cardText, {
        x: x,
        y: y + mmToPt(config.cardHeightMM) - 20,
        size: 12,
        font: Courier,
        color: rgb(0, 0, 0),
        maxWidth: mmToPt(config.cardWidthMM) - 10,
        lineHeight: 14,
    });

    // draw card border (back)
    currentPage.drawRectangle({
        x: x + mmToPt(config.cardWidthMM),
        y: y,
        width: mmToPt(config.cardWidthMM),
        height: mmToPt(config.cardHeightMM),
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
    });
}

// Serialize the PDFDocument to bytes (a Uint8Array)
const pdfBytes = await pdfDoc.save();

// Write the PDF to a file
fs.writeFileSync("output.pdf", pdfBytes);
