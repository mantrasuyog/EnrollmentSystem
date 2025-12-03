import { Platform, PermissionsAndroid } from 'react-native';
import Share from 'react-native-share';
import FileViewer from 'react-native-file-viewer';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { generatePDF } from 'react-native-html-to-pdf';

interface FingerTemplateData {
  title: string;
  base64Image: string;
}

interface EnrollmentReportData {
  registrationNumber: string;
  name: string;
  centreCode: string;
  scannedData: Array<{ name: string; value: string }>;
  portraitImage?: string;
  documentImage?: string;
  faceImage?: string;
  fingerTemplates?: {
    left_thumb: FingerTemplateData | null;
    left_index: FingerTemplateData | null;
    left_middle: FingerTemplateData | null;
    left_ring: FingerTemplateData | null;
    left_little: FingerTemplateData | null;
    right_thumb: FingerTemplateData | null;
    right_index: FingerTemplateData | null;
    right_middle: FingerTemplateData | null;
    right_ring: FingerTemplateData | null;
    right_little: FingerTemplateData | null;
  };
  enrollmentDate: string;
}

const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  try {
    const androidVersion = Platform.Version;
    if (typeof androidVersion === 'number' && androidVersion >= 33) {
      return true;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Permission error:', err);
    return true;
  }
};

const getBase64DataUri = (base64: string | undefined): string => {
  if (!base64) return '';
  if (base64.startsWith('data:image')) {
    return base64;
  }
  return `data:image/jpeg;base64,${base64}`;
};

const generateHTMLContent = (data: EnrollmentReportData): string => {
  const profileImage = data.faceImage || data.portraitImage;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const leftFingers = ['left_thumb', 'left_index', 'left_middle', 'left_ring', 'left_little'] as const;
  const rightFingers = ['right_thumb', 'right_index', 'right_middle', 'right_ring', 'right_little'] as const;

  const hasLeftFingers = data.fingerTemplates && leftFingers.some(key => data.fingerTemplates?.[key]);
  const hasRightFingers = data.fingerTemplates && rightFingers.some(key => data.fingerTemplates?.[key]);

  const scannedDataItems = data.scannedData.slice(0, 6).map(item => `
    <div class="info-item">
      <span class="info-label">${item.name}</span>
      <span class="info-value">${item.value}</span>
    </div>
  `).join('');

  let documentsHTML = '';
  if (data.documentImage || data.portraitImage || data.faceImage) {
    documentsHTML = `
      <div class="section">
        <div class="section-header">
          <div class="section-title">Captured Documents</div>
        </div>
        <div class="section-body">
          <div class="doc-grid">
            ${data.documentImage ? `
              <div class="doc-item">
                <img src="${getBase64DataUri(data.documentImage)}" alt="ID" />
                <span>ID Document</span>
              </div>
            ` : ''}
            ${data.portraitImage ? `
              <div class="doc-item">
                <img src="${getBase64DataUri(data.portraitImage)}" alt="Portrait" />
                <span>Portrait</span>
              </div>
            ` : ''}
            ${data.faceImage ? `
              <div class="doc-item">
                <img src="${getBase64DataUri(data.faceImage)}" alt="Face" />
                <span>Face</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  let fingerprintsHTML = '';
  if (hasLeftFingers || hasRightFingers) {
    const rightFingersHTML = hasRightFingers && data.fingerTemplates ? rightFingers.map(key => {
      const finger = data.fingerTemplates?.[key];
      if (finger) {
        return `
          <div class="fp-item">
            <img src="${getBase64DataUri(finger.base64Image)}" alt="${finger.title}" />
            <span>${finger.title.replace('Right ', '').replace('Left ', '')}</span>
          </div>
        `;
      }
      return '';
    }).join('') : '';

    const leftFingersHTML = hasLeftFingers && data.fingerTemplates ? leftFingers.map(key => {
      const finger = data.fingerTemplates?.[key];
      if (finger) {
        return `
          <div class="fp-item">
            <img src="${getBase64DataUri(finger.base64Image)}" alt="${finger.title}" />
            <span>${finger.title.replace('Right ', '').replace('Left ', '')}</span>
          </div>
        `;
      }
      return '';
    }).join('') : '';

    fingerprintsHTML = `
      <div class="section">
        <div class="section-header">
          <div class="section-title">Biometric Fingerprints</div>
        </div>
        <div class="section-body">
          <div class="fp-container">
            ${hasRightFingers ? `
              <div class="fp-hand">
                <div class="fp-hand-label">R</div>
                <div class="fp-grid">${rightFingersHTML}</div>
              </div>
            ` : ''}
            ${hasLeftFingers ? `
              <div class="fp-hand">
                <div class="fp-hand-label">L</div>
                <div class="fp-grid">${leftFingersHTML}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { margin: 0; size: A4; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          color: #1a1a1a;
          background: #fff;
          height: 100%;
        }
        .page {
          width: 100%;
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .header {
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
          padding: 18px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-left h1 {
          font-size: 20px;
          color: #fff;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .header-left p {
          font-size: 10px;
          color: rgba(255,255,255,0.85);
        }
        .status-badge {
          background: #10b981;
          color: #fff;
          padding: 6px 14px;
          border-radius: 15px;
          font-size: 10px;
          font-weight: 600;
        }

        /* Main Content */
        .content {
          flex: 1;
          padding: 20px 25px;
          display: flex;
          flex-direction: column;
        }

        /* Profile Row */
        .profile-row {
          display: flex;
          gap: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 15px 20px;
          margin-bottom: 15px;
          align-items: center;
        }
        .profile-img {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #fff;
          box-shadow: 0 3px 10px rgba(0,0,0,0.12);
        }
        .profile-info { flex: 1; }
        .profile-name {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .profile-meta {
          display: flex;
          gap: 30px;
        }
        .meta-box {
          display: flex;
          flex-direction: column;
        }
        .meta-label {
          font-size: 8px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .meta-value {
          font-size: 13px;
          font-weight: 700;
          color: #1e3a8a;
        }

        /* Section */
        .section {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 15px;
          overflow: hidden;
        }
        .section-header {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          padding: 10px 18px;
          border-bottom: 1px solid #e2e8f0;
        }
        .section-title {
          font-size: 11px;
          font-weight: 700;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .section-body {
          padding: 12px 18px;
        }

        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 30px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .info-label {
          color: #64748b;
          font-size: 10px;
        }
        .info-value {
          color: #1e293b;
          font-weight: 600;
          font-size: 10px;
        }

        /* Documents Grid */
        .doc-grid {
          display: flex;
          gap: 20px;
          justify-content: center;
          padding: 5px 0;
        }
        .doc-item {
          text-align: center;
        }
        .doc-item img {
          width: 155px;
          height: 115px;
          object-fit: cover;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        }
        .doc-item span {
          display: block;
          margin-top: 8px;
          font-size: 9px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
        }

        /* Fingerprints */
        .fp-container {
          padding: 5px 0;
        }
        .fp-hand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .fp-hand:last-child { margin-bottom: 0; }
        .fp-hand-label {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .fp-grid {
          display: flex;
          gap: 10px;
          flex: 1;
        }
        .fp-item {
          text-align: center;
          /* Keep flex: 1 to ensure even spacing in the row */
          flex: 1; 
        }
        /* MODIFIED: Increased width from 40px to 60px. Height remains 80px. */
        .fp-item img {
          width: 60px; /* Increased width */
          max-width: 60px; /* Constrain size */
          height: 80px; /* Height remains the same */
          object-fit: contain;
          border-radius: 6px;
          border: 2px solid #e2e8f0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          margin: 0 auto;
          display: block;
        }
        .fp-item span {
          display: block;
          margin-top: 4px;
          font-size: 7px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
        }

        /* Footer */
        .footer {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 12px 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .footer-left {
          color: rgba(255,255,255,0.85);
          font-size: 9px;
        }
        .footer-left strong {
          color: #fff;
        }
        .footer-right {
          text-align: right;
        }
        .doc-id {
          font-family: monospace;
          background: rgba(255,255,255,0.1);
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 9px;
          color: rgba(255,255,255,0.9);
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="header-left">
            <h1>Enrollment Report</h1>
            <p>Biometric Identity Verification System</p>
          </div>
          <div class="status-badge">ENROLLED</div>
        </div>

        <div class="content">
          <div class="profile-row">
            ${profileImage ? `<img src="${getBase64DataUri(profileImage)}" class="profile-img" alt="Profile" />` : ''}
            <div class="profile-info">
              <div class="profile-name">${data.name || 'N/A'}</div>
              <div class="profile-meta">
                <div class="meta-box">
                  <span class="meta-label">Registration No.</span>
                  <span class="meta-value">${data.registrationNumber || 'N/A'}</span>
                </div>
                <div class="meta-box">
                  <span class="meta-label">Centre Code</span>
                  <span class="meta-value">${data.centreCode || 'N/A'}</span>
                </div>
                <div class="meta-box">
                  <span class="meta-label">Enrollment Date</span>
                  <span class="meta-value">${data.enrollmentDate || currentDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-header">
              <div class="section-title">Personal Information</div>
            </div>
            <div class="section-body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Full Name</span>
                  <span class="info-value">${data.name || 'N/A'}</span>
                </div>
                ${scannedDataItems}
              </div>
            </div>
          </div>

          ${documentsHTML}
          ${fingerprintsHTML}
        </div>

        <div class="footer">
          <div class="footer-left">
            <strong>Official Enrollment Report</strong> &nbsp;|&nbsp; Generated: ${currentDate}
          </div>
          <div class="footer-right">
            <span class="doc-id">${data.registrationNumber || 'RPT'}-${Date.now()}</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePDFWithHTML = async (data: EnrollmentReportData): Promise<string> => {
  const htmlContent = generateHTMLContent(data);

  const timestamp = Date.now();
  const regNo = (data.registrationNumber || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Enrollment_Report_${regNo}_${timestamp}`;

  const options = {
    html: htmlContent,
    fileName: fileName,
    directory: Platform.OS === 'android' ? 'Download' : 'Documents',
    height: 842,
    width: 595,
  };

  const file = await generatePDF(options);

  if (!file.filePath) {
    throw new Error('Failed to generate PDF file');
  }

  return file.filePath;
};

export const generateAndSharePDF = async (
  data: EnrollmentReportData
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    await requestStoragePermission();

    const filePath = await generatePDFWithHTML(data);

    try {
      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.android.actionViewIntent(
          filePath,
          'application/pdf'
        );
      } else {
        await FileViewer.open(filePath, { showOpenWithDialog: true });
      }
    } catch (viewerError: any) {
      console.log('Viewer error:', viewerError?.message);
      try {
        await Share.open({
          url: `file://${filePath}`,
          type: 'application/pdf',
          title: 'Open Enrollment Report',
        });
      } catch (shareError: any) {
        if (!shareError?.message?.includes('User did not share')) {
          console.log('Share error:', shareError?.message);
        }
      }
    }

    return { success: true, filePath };
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message || 'Failed to generate PDF' };
  }
};

export default {
  generateAndSharePDF,
};