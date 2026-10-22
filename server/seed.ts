import { db, initDatabase } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storageDir = path.resolve(__dirname, '../storage/documents');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

function createDummyPdf(filename: string, content: string): string {
  const safeDiskName = filename.replace(/[\/\\]/g, '_');
  const filePath = path.join(storageDir, safeDiskName);
  // Simple PDF header + text stream if not existing
  if (!fs.existsSync(filePath)) {
    const pdfData = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${content.length + 50} >> stream
BT /F1 12 Tf 72 712 Td (${content.replace(/[\(\)]/g, '')}) Tj ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
426
%%EOF`;
    fs.writeFileSync(filePath, pdfData);
  }
  return safeDiskName;
}

export function seedData() {
  initDatabase();

  // Clear existing
  db.exec(`
    DELETE FROM legal_ai_queries;
    DELETE FROM share_links;
    DELETE FROM audit_events;
    DELETE FROM document_reviews;
    DELETE FROM legal_documents;
    DELETE FROM plots;
    DELETE FROM properties;
    DELETE FROM projects;
    DELETE FROM users;
  `);

  console.log('Seeding users...');
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)
  `);
  insertUser.run('usr-mansoor', 'Advocate Mansoor', 'mansoor@amiproperties.com', 'Legal Advisor');
  insertUser.run('usr-admin', 'Admin', 'admin@amiproperties.com', 'Administrator');

  console.log('Seeding projects...');
  const insertProject = db.prepare(`
    INSERT INTO projects (id, name, code, location) VALUES (?, ?, ?, ?)
  `);
  insertProject.run('prj-perur', 'Ami Perur Enclave — phase 1', 'PRJ-PERUR', 'Perur, Coimbatore');
  insertProject.run('prj-sulur', 'Ami Sulur Land', 'PRJ-SULUR', 'Sulur, Coimbatore');
  insertProject.run('prj-heritage', 'Ami Heritage City', 'PRJ-HERITAGE', 'Singanallur, Coimbatore');
  insertProject.run('prj-vishnu', 'Ami Vishnu Land', 'PRJ-VISHNU', 'Kinathukadavu, Coimbatore');
  insertProject.run('prj-ismail', 'Ami Ismail Land', 'PRJ-ISMAIL', 'Pollachi Road, Coimbatore');

  console.log('Seeding properties...');
  const insertProperty = db.prepare(`
    INSERT INTO properties (id, project_id, identifier, name, location, identified_by, current_status, time_in_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProperty.run(
    'prop-1',
    'prj-perur',
    'LND-26-00001',
    'Ami Perur Enclave',
    'Perur, Coimbatore',
    'Broker — Satyaseelan',
    'Open',
    '3 days'
  );
  insertProperty.run(
    'prop-2',
    'prj-heritage',
    'LND-26-00002',
    'Ami Heritage City',
    'Singanallur, Coimbatore',
    'Direct Owner',
    'Open',
    '3 days'
  );
  insertProperty.run(
    'prop-3',
    'prj-sulur',
    'LND-26-00003',
    'Ami Sulur Land',
    'Sulur, Coimbatore',
    'Broker — Ramanathan',
    'Open',
    '3 days'
  );
  insertProperty.run(
    'prop-4',
    'prj-ismail',
    'LND-26-00004',
    'Ami Ismail Land',
    'Pollachi Road, Coimbatore',
    'Broker — Satyaseelan',
    'Open',
    '3 days'
  );
  insertProperty.run(
    'prop-5',
    'prj-vishnu',
    'LND-26-00005',
    'Ami Vishnu Land',
    'Kinathukadavu, Coimbatore',
    'Direct Owner',
    'Open',
    '3 days'
  );

  console.log('Seeding legal documents...');
  const insertDoc = db.prepare(`
    INSERT INTO legal_documents (
      id, property_id, title, original_filename, document_type, document_number,
      storage_key, file_size, review_status, review_comments, reviewer_name, reviewed_at, extracted_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Documents for LND-26-00001 (Ami Perur Enclave) - 16 documents total (15 verified, 1 awaiting review)
  const perurDocs = [
    {
      id: 'doc-perur-01',
      title: 'Ownership chain flow chart',
      filename: 'Ownership chain flow chart.png',
      type: 'Flowchart',
      status: 'Awaiting review',
      comments: '',
      reviewer: null,
      reviewedAt: null,
      text: 'Title chain flow from 1944 Bagasasanam to present owner AMI Properties.'
    },
    {
      id: 'doc-perur-02',
      title: 'Doc no 4853/2026 - power document',
      filename: 'General Power of Attorney Manonmani and Aravindhan Doc.No.4853.pdf',
      type: 'Power of Attorney',
      number: '4853/2026',
      status: 'Verified',
      comments: 'verified',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 14:30:00',
      text: 'General Power of Attorney executed by Manonmani and Aravindhan registered as Doc. No. 4853/2026 at Sub-Registrar Office Perur.'
    },
    {
      id: 'doc-perur-03',
      title: 'Periyasamy legal heirs ceritificate',
      filename: 'Periyasamy legal heirs.pdf',
      type: 'Legal Heir Certificate',
      status: 'Verified',
      comments: 'its good and verified',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 14:35:00',
      text: 'Legal Heir Certificate of late Periyasamy issued by Tahsildar Perur Taluk confirming surviving legal heirs.'
    },
    {
      id: 'doc-perur-04',
      title: 'Periyasamy death certificate',
      filename: 'periyasamy death certificate.pdf',
      type: 'Death Certificate',
      status: 'Verified',
      comments: 'verified',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 14:38:00',
      text: 'Death certificate of Periyasamy registered with local registrar.'
    },
    {
      id: 'doc-perur-05',
      title: 'Final approved layout map',
      filename: 'Perur layout 1.pdf',
      type: 'Layout Plan',
      status: 'Verified',
      comments: 'checked and verified',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 14:40:00',
      text: 'Approved layout plan with DTCP sanction order number 112/2025.'
    },
    {
      id: 'doc-perur-06',
      title: 'Perur panchayath order',
      filename: 'perur aravind land panchayath approval.pdf',
      type: 'Panchayat Approval',
      status: 'Verified',
      comments: 'approved by local body',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 14:42:00',
      text: 'Panchayat union approval order permitting development.'
    },
    {
      id: 'doc-perur-07',
      title: '1987 docment from revenue department',
      filename: '29 Sept 2026 1-23 pm.pdf',
      type: 'Revenue Record',
      status: 'Verified',
      comments: 'inam document verified and its legal now',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 14:45:00',
      text: 'Revenue department inam land resumption settlement register extract from 1987 confirming conversion to ryotwari patta.'
    },
    {
      id: 'doc-perur-08',
      title: 'Doc no 770/1944 bagasasanam',
      filename: 'Bagasasana Pathiram True copy 2.pdf',
      type: 'Partition Deed',
      number: '770/1944',
      status: 'Verified',
      comments: 'bagasasanam verified',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 14:50:00',
      text: 'Registered Bagasasanam (Family Partition Deed) No. 770/1944 Coimbatore DR office between family co-sharers.'
    },
    {
      id: 'doc-perur-09',
      title: 'Doc no 6621/2025-Bagaviduthalai',
      filename: 'Bagapathiya Viduthalai Pathiram.pdf',
      type: 'Release Deed',
      number: '6621/2025',
      status: 'Verified',
      comments: 'relinquishment deed verified',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 14:55:00',
      text: 'Registered Release Deed Doc No 6621/2025 relinquishing co-sharer claims.'
    },
    {
      id: 'doc-perur-10',
      title: 'Patta transfer order',
      filename: 'Perur Patta Passbook.pdf',
      type: 'Patta',
      status: 'Verified',
      comments: 'patta updated in e-services',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 15:00:00',
      text: 'Patta Passbook No 4129 in the name of the current promoter.'
    },
    {
      id: 'doc-perur-11',
      title: 'EC certificate 1975-2026',
      filename: 'Encumbrance Certificate Perur.pdf',
      type: 'Encumbrance Certificate',
      status: 'Verified',
      comments: 'clean EC for 50 years',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 15:05:00',
      text: 'Tamil Nadu Registration Dept Nil Encumbrance Certificate from 01.01.1975 to current date.'
    },
    {
      id: 'doc-perur-12',
      title: 'Adangal extract',
      filename: 'Adangal Copy Fasli 1432.pdf',
      type: 'Revenue Record',
      status: 'Verified',
      comments: 'classification verified dry land',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 15:10:00',
      text: 'Village administrative Adangal extract showing Punjai (dry) land.'
    },
    {
      id: 'doc-perur-13',
      title: 'FMB sketch',
      filename: 'Field Measurement Book Sketch SF 124.pdf',
      type: 'Survey Sketch',
      status: 'Verified',
      comments: 'boundaries tally with site',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 15:12:00',
      text: 'Survey department certified FMB sketch for SF No 124.'
    },
    {
      id: 'doc-perur-14',
      title: 'Parent deed 1950',
      filename: 'Sale Deed Doc No 2510_1950.pdf',
      type: 'Sale Deed',
      number: '2510/1950',
      status: 'Verified',
      comments: 'parent title clear',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 15:15:00',
      text: 'Sale Deed Doc No. 2510/1950 Coimbatore DR between Rangappa Gounder & Periya Gounder.'
    },
    {
      id: 'doc-perur-15',
      title: 'Partition deed 1984',
      filename: 'Partition Deed Doc No 41_1984.pdf',
      type: 'Partition Deed',
      number: '41/1984',
      status: 'Verified',
      comments: 'partition shares demarcated',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 15:20:00',
      text: 'Partition Deed Doc No. 41/1984 Singanallur SRO allotting SF 76/2 part.'
    },
    {
      id: 'doc-perur-16',
      title: 'Road handover gift deed',
      filename: 'perur aravind land road handover 7888/2026.pdf',
      type: 'Gift Deed',
      number: '7888/2026',
      status: 'Verified',
      comments: 'front docunet verifies',
      reviewer: 'Admin',
      reviewedAt: '2026-10-20 15:25:00',
      text: 'Gift Deed handing over internal 30ft roads and park reservations to Perur Town Panchayat.'
    }
  ];

  for (const doc of perurDocs) {
    const key = createDummyPdf(doc.filename, `AMI Properties - ${doc.title}: ${doc.text}`);
    insertDoc.run(
      doc.id,
      'prop-1',
      doc.title,
      doc.filename,
      doc.type,
      doc.number || null,
      key,
      1024 * 145,
      doc.status,
      doc.comments,
      doc.reviewer,
      doc.reviewedAt,
      doc.text
    );
  }

  // Documents for LND-26-00002 (Ami Heritage City) - 8 documents (0 verified, awaiting review)
  const heritageDocs = [
    {
      id: 'doc-her-01',
      title: 'DTCP FINAL ORDER',
      filename: 'SIHS FINAL DTCP ORDER.pdf',
      type: 'DTCP Order',
      number: 'DTCP/2023/889',
      status: 'Awaiting review',
      comments: '',
      text: 'Final Directorate of Town and Country Planning sanction order.'
    },
    {
      id: 'doc-her-02',
      title: 'Layout pdf',
      filename: 'AMI HERITAGE CITY.pdf',
      type: 'Layout Plan',
      status: 'Awaiting review',
      comments: '',
      text: 'Detailed layout subdivision map for AMI Heritage City.'
    },
    {
      id: 'doc-her-03',
      title: 'Doc No 5870/2022 (Sale Deed)',
      filename: 'Sale Deed 5870_2022.pdf',
      type: 'Sale Deed',
      number: '5870/2022',
      status: 'Awaiting review',
      comments: '',
      text: 'Sale deed executed on 25.03.2022 in favor of M/s. AMI PROPERTIES (represented by partner I. Abdul Rahman) and A. Shajahan (represented by GPA agent A.R. Abuthahir).'
    },
    {
      id: 'doc-her-04',
      title: 'Doc No 5871/2022 (Sale Deed)',
      filename: 'Sale Deed 5871_2022.pdf',
      type: 'Sale Deed',
      number: '5871/2022',
      status: 'Awaiting review',
      comments: '',
      text: 'Sale deed executed on 25.03.2022 in favor of M/s. AMI PROPERTIES (represented by partner I. Abdul Rahman) and A. Shajahan (represented by GPA agent A.R. Abuthahir).'
    },
    {
      id: 'doc-her-05',
      title: 'Doc No 7802/2023 (Sale Deed)',
      filename: 'Sale Deed 7802_2023.pdf',
      type: 'Sale Deed',
      number: '7802/2023',
      status: 'Awaiting review',
      comments: '',
      text: 'Sale deed executed on 08.06.2023 in favor of M/s. AMI PROPERTIES (represented by partner I. Abdul Rahman) and A. Shajahan (represented by GPA agent A.R. Abuthahir).'
    },
    {
      id: 'doc-her-06',
      title: 'Legal Heir Cert P.Mu. 30217/1992',
      filename: 'Legal Heir Cert P.Mu. 30217_1992.pdf',
      type: 'Legal Heir Certificate',
      number: 'P.Mu. 30217/1992/A4',
      status: 'Awaiting review',
      comments: '',
      text: 'Death of Rangappa Gounder on 26.12.1971. Surviving legal heirs: R. Venkatachalam (Son), R. Rangammal (Daughter).'
    },
    {
      id: 'doc-her-07',
      title: 'Partition Deed 41/1984',
      filename: 'Partition Deed 41_1984.pdf',
      type: 'Partition Deed',
      number: '41/1984',
      status: 'Awaiting review',
      comments: '',
      text: 'Partition Deed Doc No. 41/1984 Singanallur SRO between R. Ramasamy & Family allotting B Schedule SF 76/2 part.'
    },
    {
      id: 'doc-her-08',
      title: 'Bank clearance certificate',
      filename: 'NOC from Canara Bank title now clear.pdf',
      type: 'NOC / Clearance',
      status: 'Awaiting review',
      comments: '',
      text: 'bank, title now clear.'
    }
  ];

  for (const doc of heritageDocs) {
    const key = createDummyPdf(doc.filename, `AMI Properties - ${doc.title}: ${doc.text}`);
    insertDoc.run(
      doc.id,
      'prop-2',
      doc.title,
      doc.filename,
      doc.type,
      doc.number || null,
      key,
      1024 * 160,
      doc.status,
      doc.comments,
      null,
      null,
      doc.text
    );
  }

  // Documents for LND-26-00003 (Ami Sulur Land) - 14 documents (2 verified)
  for (let i = 1; i <= 14; i++) {
    const isVer = i <= 2;
    const title = `Sulur Record ${i} - ${i === 1 ? 'Parent Deed 1978' : i === 2 ? 'Patta Extract' : 'Revenue Document ' + i}`;
    const fname = `Sulur_Doc_${i}.pdf`;
    createDummyPdf(fname, `Sulur Land Document ${i}`);
    insertDoc.run(
      `doc-sulur-${i}`,
      'prop-3',
      title,
      fname,
      'Legal Record',
      `SUL/${i}`,
      fname,
      1024 * 110,
      isVer ? 'Verified' : 'Awaiting review',
      isVer ? 'verified Sulur record' : '',
      isVer ? 'Admin' : null,
      isVer ? '2026-10-20 16:00:00' : null,
      `Sulur property documentation ${i}`
    );
  }

  console.log('Seeding plots for AI Search...');
  const insertPlot = db.prepare(`
    INSERT INTO plots (id, project_id, property_id, plot_number, size_cents, size_sqft, road_width_ft, direction, availability, price_inr, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const plots = [
    { id: 'plt-01', prj: 'prj-perur', prop: 'prop-1', num: 'Plot 1A', cents: 2.1, sqft: 914.76, road: 30, dir: 'North-East', avail: 'Available', price: 1850000 },
    { id: 'plt-02', prj: 'prj-perur', prop: 'prop-1', num: 'Plot 2B', cents: 2.5, sqft: 1089.0, road: 30, dir: 'East', avail: 'Available', price: 2200000 },
    { id: 'plt-03', prj: 'prj-perur', prop: 'prop-1', num: 'Plot 3', cents: 3.2, sqft: 1393.92, road: 40, dir: 'North-East', avail: 'Available', price: 2900000 },
    { id: 'plt-04', prj: 'prj-perur', prop: 'prop-1', num: 'Plot 4', cents: 1.8, sqft: 784.08, road: 30, dir: 'North', avail: 'Booked', price: 1600000 },
    { id: 'plt-05', prj: 'prj-perur', prop: 'prop-1', num: 'Plot 5A', cents: 4.5, sqft: 1960.2, road: 40, dir: 'North-East', avail: 'Available', price: 4100000 },
    { id: 'plt-06', prj: 'prj-heritage', prop: 'prop-2', num: 'H-101', cents: 2.4, sqft: 1045.44, road: 30, dir: 'North-East', avail: 'Available', price: 2600000 },
    { id: 'plt-07', prj: 'prj-heritage', prop: 'prop-2', num: 'H-102', cents: 3.0, sqft: 1306.8, road: 30, dir: 'East', avail: 'Available', price: 3300000 },
    { id: 'plt-08', prj: 'prj-heritage', prop: 'prop-2', num: 'H-103', cents: 1.9, sqft: 827.64, road: 24, dir: 'West', avail: 'Sold', price: 2100000 },
    { id: 'plt-09', prj: 'prj-heritage', prop: 'prop-2', num: 'H-104', cents: 5.2, sqft: 2265.12, road: 40, dir: 'North-East', avail: 'Available', price: 5800000 },
    { id: 'plt-10', prj: 'prj-sulur', prop: 'prop-3', num: 'S-01', cents: 2.2, sqft: 958.32, road: 30, dir: 'North-East', avail: 'Available', price: 1750000 },
    { id: 'plt-11', prj: 'prj-sulur', prop: 'prop-3', num: 'S-02', cents: 3.5, sqft: 1524.6, road: 33, dir: 'South', avail: 'Available', price: 2800000 },
    { id: 'plt-12', prj: 'prj-sulur', prop: 'prop-3', num: 'S-03', cents: 6.0, sqft: 2613.6, road: 40, dir: 'North', avail: 'Available', price: 4800000 },
  ];

  for (const p of plots) {
    insertPlot.run(p.id, p.prj, p.prop, p.num, p.cents, p.sqft, p.road, p.dir, p.avail, p.price, JSON.stringify({ corner: p.dir.includes('-') }));
  }

  console.log('Seeding pre-recorded Legal AI queries matching the reference video...');
  const insertAiQuery = db.prepare(`
    INSERT INTO legal_ai_queries (id, property_id, user_name, question, answer, date_label)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAiQuery.run(
    'ai-q-1',
    'prop-2',
    'Advocate Mansoor',
    'Draw the ownership chain of this property as a flow chart, from the earliest document to the current owner, with the document number and date on each step.',
    `### Ownership / Title History Table

| Date / Year | Document / Event | Reference / Doc No. | Parties Involved | Property / Share Transferred |
|---|---|---|---|---|
| **28.06.1950** | Sale Deed | Doc No. 2510/1950 (Coimbatore DR) | Rangappa Gounder & Periya Gounder (Purchasers) | SF 77 (Joint purchase, later orally partitioned) |
| **26.12.1971** | Death of Rangappa Gounder | Legal Heir Cert P.Mu. 30217/1992/A4 | Legal Heirs: **R. Venkatachalam** (Son), **R. Rangammal** (Daughter) | Deceased share in SF 77 |
| **19.01.1984** | Partition Deed | Doc No. 41/1984 (Singanallur SRO) | R. Ramasamy & Family | 'B' Schedule: SF 76/2 part (0.30 Acre) allotted to **R. Ramasamy** |
| **25.03.2022** | Sale Deed | Doc No. 5870/2022 & 5871/2022 | Vendors to M/s. AMI PROPERTIES & A. Shajahan | Development property share |
| **08.06.2023** | Sale Deed | Doc No. 7802/2023 | Co-owners to M/s. AMI PROPERTIES | Complete consolidated title |

> **Note on title/heirship:** The recitals in Doc Nos. 5870/2022 and 5871/2022 acknowledge that an earlier 2010 transfer erroneously stated that **Rangammal** died leaving no heirs, whereas she left legal heirs (**Paramasivam** and **Manoharan**). Whether all legal heirs in the chain of title properly executed or released their rights for the entire property share is **worth verifying with your advocate**.`,
    '19 Oct'
  );

  insertAiQuery.run(
    'ai-q-2',
    'prop-2',
    'Advocate Mansoor',
    'What is the name of the purchaser',
    `The provided sale deeds contain the following purchasers:

| Document No. | Execution Date | Purchaser Name(s) |
|---|---|---|
| **5870/2022** (Sale Deed) | 25.03.2022 | **M/s. AMI PROPERTIES** (represented by partner **I. Abdul Rahman**) and **A. Shajahan** (represented by GPA agent **A.R. Abuthahir**) |
| **5871/2022** (Sale Deed) | 25.03.2022 | **M/s. AMI PROPERTIES** (represented by partner **I. Abdul Rahman**) and **A. Shajahan** (represented by GPA agent **A.R. Abuthahir**) |
| **7802/2023** (Sale Deed) | 08.06.2023 | **M/s. AMI PROPERTIES** (represented by partner **I. Abdul Rahman**) and **A. Shajahan** (represented by GPA agent **A.R. Abuthahir**) |

> **Summary:** The principal purchasers in all primary title deeds are **M/s. AMI PROPERTIES** represented by managing partner **I. Abdul Rahman**, jointly with co-purchaser **A. Shajahan** represented by General Power of Attorney agent **A.R. Abuthahir**.`,
    '22 Oct'
  );

  console.log('Database seeded successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedData();
}
