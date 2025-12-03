import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';

let db: QuickSQLiteConnection | null = null;

const DB_NAME = 'enrollment.db';

export const initDatabase = (): void => {
  try {
    db = open({ name: DB_NAME });

    db.execute(`
      CREATE TABLE IF NOT EXISTS scan_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_number TEXT UNIQUE,
        name TEXT,
        portrait_image TEXT,
        document_image TEXT,
        scanned_json TEXT,
        centre_code TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.execute(`
      CREATE TABLE IF NOT EXISTS face_enrollment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        enrolled_image_base64 TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.execute(`
      CREATE TABLE IF NOT EXISTS finger_enrollment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        finger_key TEXT UNIQUE,
        title TEXT,
        base64_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.execute(`
      CREATE TABLE IF NOT EXISTS user_enrollment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_enrolled INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (__DEV__) {
      console.log('Database initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

const getDb = (): QuickSQLiteConnection => {
  if (!db) {
    initDatabase();
  }
  return db!;
};


export interface ScanDataRecord {
  registration_number: string;
  name: string;
  portrait_image: string;
  document_image: string;
  scanned_json: string;
  centre_code: string;
}

export const clearAndSaveScanData = (data: ScanDataRecord): void => {
  try {
    const database = getDb();
    database.execute('DELETE FROM scan_data');
    database.execute(
      `INSERT INTO scan_data (registration_number, name, portrait_image, document_image, scanned_json, centre_code)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.registration_number,
        data.name,
        data.portrait_image,
        data.document_image,
        data.scanned_json,
        data.centre_code,
      ]
    );
    if (__DEV__) {
      console.log('Scan data saved to SQLite');
    }
  } catch (error) {
    console.error('Failed to save scan data:', error);
  }
};

export const getScanData = (): ScanDataRecord | null => {
  try {
    const database = getDb();
    const result = database.execute('SELECT * FROM scan_data LIMIT 1');
    if (result.rows && result.rows.length > 0) {
      const row = result.rows.item(0);
      return {
        registration_number: row.registration_number,
        name: row.name,
        portrait_image: row.portrait_image,
        document_image: row.document_image,
        scanned_json: row.scanned_json,
        centre_code: row.centre_code,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get scan data:', error);
    return null;
  }
};

export const clearScanDataFromDb = (): void => {
  try {
    const database = getDb();
    database.execute('DELETE FROM scan_data');
    if (__DEV__) {
      console.log('Scan data cleared from SQLite');
    }
  } catch (error) {
    console.error('Failed to clear scan data:', error);
  }
};


export const clearAndSaveFaceEnrollment = (enrolledImageBase64: string): void => {
  try {
    const database = getDb();
    database.execute('DELETE FROM face_enrollment');
    database.execute(
      'INSERT INTO face_enrollment (enrolled_image_base64) VALUES (?)',
      [enrolledImageBase64]
    );
    if (__DEV__) {
      console.log('Face enrollment saved to SQLite');
    }
  } catch (error) {
    console.error('Failed to save face enrollment:', error);
  }
};

export const getFaceEnrollment = (): string | null => {
  try {
    const database = getDb();
    const result = database.execute('SELECT enrolled_image_base64 FROM face_enrollment LIMIT 1');
    if (result.rows && result.rows.length > 0) {
      return result.rows.item(0).enrolled_image_base64;
    }
    return null;
  } catch (error) {
    console.error('Failed to get face enrollment:', error);
    return null;
  }
};

export const clearFaceEnrollmentFromDb = (): void => {
  try {
    const database = getDb();
    database.execute('DELETE FROM face_enrollment');
    if (__DEV__) {
      console.log('Face enrollment cleared from SQLite');
    }
  } catch (error) {
    console.error('Failed to clear face enrollment:', error);
  }
};


export interface FingerTemplateRecord {
  finger_key: string;
  title: string;
  base64_image: string;
}

export const clearAndSaveFingerTemplates = (templates: FingerTemplateRecord[]): void => {
  try {
    const database = getDb();
    database.execute('DELETE FROM finger_enrollment');
    templates.forEach((template) => {
      database.execute(
        'INSERT INTO finger_enrollment (finger_key, title, base64_image) VALUES (?, ?, ?)',
        [template.finger_key, template.title, template.base64_image]
      );
    });
    if (__DEV__) {
      console.log(`${templates.length} finger templates saved to SQLite`);
    }
  } catch (error) {
    console.error('Failed to save finger templates:', error);
  }
};

export const saveFingerTemplate = (template: FingerTemplateRecord): void => {
  try {
    const database = getDb();
    database.execute(
      'INSERT OR REPLACE INTO finger_enrollment (finger_key, title, base64_image) VALUES (?, ?, ?)',
      [template.finger_key, template.title, template.base64_image]
    );
    if (__DEV__) {
      console.log(`Finger template ${template.finger_key} saved to SQLite`);
    }
  } catch (error) {
    console.error('Failed to save finger template:', error);
  }
};

export interface FingerTemplateItem {
  title: string;
  base64Image: string;
}

export interface FingerTemplatesDb {
  left_thumb: FingerTemplateItem | null;
  left_index: FingerTemplateItem | null;
  left_middle: FingerTemplateItem | null;
  left_ring: FingerTemplateItem | null;
  left_little: FingerTemplateItem | null;
  right_thumb: FingerTemplateItem | null;
  right_index: FingerTemplateItem | null;
  right_middle: FingerTemplateItem | null;
  right_ring: FingerTemplateItem | null;
  right_little: FingerTemplateItem | null;
}

export const getFingerTemplates = (): FingerTemplatesDb => {
  try {
    const database = getDb();
    const result = database.execute('SELECT * FROM finger_enrollment');

    const templates: FingerTemplatesDb = {
      left_thumb: null,
      left_index: null,
      left_middle: null,
      left_ring: null,
      left_little: null,
      right_thumb: null,
      right_index: null,
      right_middle: null,
      right_ring: null,
      right_little: null,
    };

    if (result.rows && result.rows.length > 0) {
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        const key = row.finger_key as keyof FingerTemplatesDb;
        templates[key] = {
          title: row.title,
          base64Image: row.base64_image,
        };
      }
    }
    return templates;
  } catch (error) {
    console.error('Failed to get finger templates:', error);
    return {
      left_thumb: null,
      left_index: null,
      left_middle: null,
      left_ring: null,
      left_little: null,
      right_thumb: null,
      right_index: null,
      right_middle: null,
      right_ring: null,
      right_little: null,
    };
  }
};

export const clearFingerEnrollmentFromDb = (): void => {
  try {
    const database = getDb();
    database.execute('DELETE FROM finger_enrollment');
    if (__DEV__) {
      console.log('Finger enrollment cleared from SQLite');
    }
  } catch (error) {
    console.error('Failed to clear finger enrollment:', error);
  }
};


export const hasEnrollmentData = (): {
  hasScanData: boolean;
  hasFaceData: boolean;
  hasFingerData: boolean;
  hasAnyData: boolean;
} => {
  try {
    const database = getDb();

    const scanResult = database.execute('SELECT COUNT(*) as count FROM scan_data');
    const hasScanData = !!(scanResult.rows && scanResult.rows.item(0).count > 0);

    const faceResult = database.execute('SELECT COUNT(*) as count FROM face_enrollment');
    const hasFaceData = !!(faceResult.rows && faceResult.rows.item(0).count > 0);

    const fingerResult = database.execute('SELECT COUNT(*) as count FROM finger_enrollment');
    const hasFingerData = !!(fingerResult.rows && fingerResult.rows.item(0).count > 0);

    return {
      hasScanData,
      hasFaceData,
      hasFingerData,
      hasAnyData: hasScanData || hasFaceData || hasFingerData,
    };
  } catch (error) {
    console.error('Failed to check enrollment data:', error);
    return {
      hasScanData: false,
      hasFaceData: false,
      hasFingerData: false,
      hasAnyData: false,
    };
  }
};


export const clearAllEnrollmentData = (): void => {
  try {
    const database = getDb();
    database.execute('DELETE FROM scan_data');
    database.execute('DELETE FROM face_enrollment');
    database.execute('DELETE FROM finger_enrollment');
    database.execute('DELETE FROM user_enrollment');
    if (__DEV__) {
      console.log('All enrollment data cleared from SQLite');
    }
  } catch (error) {
    console.error('Failed to clear all enrollment data:', error);
  }
};


export const saveUserEnrollmentStatus = (enrolled: boolean): void => {
  try {
    const database = getDb();
    database.execute('DELETE FROM user_enrollment');
    database.execute(
      'INSERT INTO user_enrollment (user_enrolled) VALUES (?)',
      [enrolled ? 1 : 0]
    );
    if (__DEV__) {
      console.log(`User enrollment status saved to SQLite: ${enrolled}`);
    }
  } catch (error) {
    console.error('Failed to save user enrollment status:', error);
  }
};

export const getUserEnrollmentStatus = (): boolean => {
  try {
    const database = getDb();
    const result = database.execute('SELECT user_enrolled FROM user_enrollment LIMIT 1');
    if (result.rows && result.rows.length > 0) {
      return result.rows.item(0).user_enrolled === 1;
    }
    return false;
  } catch (error) {
    console.error('Failed to get user enrollment status:', error);
    return false;
  }
};

export const clearUserEnrollmentFromDb = (): void => {
  try {
    const database = getDb();
    database.execute('DELETE FROM user_enrollment');
    if (__DEV__) {
      console.log('User enrollment status cleared from SQLite');
    }
  } catch (error) {
    console.error('Failed to clear user enrollment status:', error);
  }
};
