const fs = require('fs');
const path = require('path');
const SVGtoPDF = require('svg-to-pdfkit');
const PDFDocument = require('pdfkit');

function estimateTextWidth(text, fontSize = 60.21) {
    const avgCharWidth = fontSize * 0.55;
    return text.length * avgCharWidth;
}

async function generateCertificate(pName, eName, cType, position = null, outputPath) {
    const maxWidth = 590;
    const estimatedWidth = estimateTextWidth(pName);

    if (estimatedWidth > maxWidth) {
        return Promise.reject(new Error(`Name '${pName}' is too long (approximately ${Math.round(estimatedWidth)}px). Maximum width allowed is ${maxWidth}px.`));
    }

    if (cType === 1) {
        svg = fs.readFileSync(path.join(__dirname, '..', 'templates', 'excel_main_days_1.svg'), 'utf8');
    } else {
        svg = fs.readFileSync(path.join(__dirname, '..', 'templates', 'excel_main_days_0.svg'), 'utf8');
    }

    if (position) {
        if (position === 1) {
            position = 'First Prize';
        } else if (position === 2) {
            position = 'Second Prize';
        } else if (position === 3) {
            position = 'Third Prize';
        } else {
            return Promise.reject(new Error('Invalid position value'));
        }
    }

    svg = svg
        .replace(/{p_name}/g, pName)
        .replace(/{e_name}/g, eName)
        .replace(/{c_type}/g, cType === 1 ? 'Appreciation' : 'Participation')
        .replace(/{pos}/g, position ? position : '');

    const doc = new PDFDocument({
        size: [842, 595],
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    SVGtoPDF(doc, svg, 0, 0, {
        preserveAspectRatio: "xMinYMin meet"
    });

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
    });
}

module.exports = {
    generateCertificate
};