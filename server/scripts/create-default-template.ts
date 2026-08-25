import PizZip from 'pizzip';
import fs from 'fs';

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>{title}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Claim: {claimNumber}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Client: {clientName}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Insurer: {insurerName}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Type: {claimType}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Engineer: {engineerName}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Status: {statusName}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Date of Loss: {dateOfLoss}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Estimated Loss: {estimatedLoss}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Reserve: {reserve}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Generated: {generatedAt}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Summary: {notes}</w:t></w:r></w:p>
  </w:body>
</w:document>`;

const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

const zip = new PizZip();
zip.file('[Content_Types].xml', contentTypes);
zip.file('_rels/.rels', rels);
zip.file('word/document.xml', documentXml);
zip.file('word/_rels/document.xml.rels', docRels);

const buffer = zip.generate({ type: 'nodebuffer' });
const outPath = process.argv[2] || './default-template.docx';

fs.mkdirSync('./uploads/templates', { recursive: true });
fs.writeFileSync(outPath, buffer);
console.log(`Created ${outPath}`);
