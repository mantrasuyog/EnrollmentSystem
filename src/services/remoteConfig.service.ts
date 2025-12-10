import remoteConfig from '@react-native-firebase/remote-config';

// Remote Config Keys
export const REMOTE_CONFIG_KEYS = {
  API_BASE_URL: 'ES_001',
};

// Default values for Remote Config
const DEFAULT_CONFIG = {
  [REMOTE_CONFIG_KEYS.API_BASE_URL]: 'http://10.65.21.106:8000/api/v1',
};

class RemoteConfigService {
  private static instance: RemoteConfigService;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): RemoteConfigService {
    if (!RemoteConfigService.instance) {
      RemoteConfigService.instance = new RemoteConfigService();
    }
    return RemoteConfigService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set default values
      await remoteConfig().setDefaults(DEFAULT_CONFIG);

      // Set minimum fetch interval (0 for development, higher for production)
      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: __DEV__ ? 0 : 0, // 0 for dev, 1 hour for prod
      });

      // Fetch and activate remote config
      await this.fetchAndActivate();

      this.isInitialized = true;
      console.log('Remote Config initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Remote Config:', error);
      throw error;
    }
  }

  async fetchAndActivate(): Promise<boolean> {
    try {
      const fetchedRemotely = await remoteConfig().fetchAndActivate();

      if (fetchedRemotely) {
        console.log('Remote Config: New configs fetched and activated');
      } else {
        console.log('Remote Config: Using cached or default values');
      }

      return fetchedRemotely;
    } catch (error) {
      console.error('Failed to fetch remote config:', error);
      return false;
    }
  }

  getApiBaseUrl(): string {
    const value = remoteConfig().getValue(REMOTE_CONFIG_KEYS.API_BASE_URL);
    const url = value.asString();
    console.log('Remote Config - API Base URL (ES_001):', url);
    return url || DEFAULT_CONFIG[REMOTE_CONFIG_KEYS.API_BASE_URL];
  }

  // Get all remote config values
  getAllConfig(): Record<string, string> {
    const allKeys = remoteConfig().getAll();
    const config: Record<string, string> = {};

    Object.keys(allKeys).forEach(key => {
      config[key] = allKeys[key].asString();
    });

    console.log('Remote Config - All values:', config);
    return config;
  }

  // Generic method to get any string value
  getString(key: string): string {
    return remoteConfig().getValue(key).asString();
  }

  // Generic method to get any number value
  getNumber(key: string): number {
    return remoteConfig().getValue(key).asNumber();
  }

  // Generic method to get any boolean value
  getBoolean(key: string): boolean {
    return remoteConfig().getValue(key).asBoolean();
  }
}

export const remoteConfigService = RemoteConfigService.getInstance();
export default remoteConfigService;
