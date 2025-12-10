import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme, ActivityIndicator, View, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import HomeScreen from './src/screens/HomeScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import FaceRecongition from './src/screens/FaceRecongition';
import FaceAndFingerEnrollmentScreen from './src/screens/FaceAndFingerEnrollmentScreen';
import SplashScreen from './src/screens/SplashScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DocumentUploadScreen from './src/screens/DocumentUploadScreen';
import FingerCaptureScreen from './src/screens/FingerCaptureScreen';
import Tech5FaceCaptureScreen from './src/screens/Tech5FaceCaptureScreen';

import type { RootStackParamList } from './src/screens/HomeScreen';
import { store, persistor } from './src/redux/store';
import { initDatabase } from './src/services/database.service';
import { initializeApiWithRemoteConfig, syncApiBaseUrlWithRedux } from './src/services/api.service';

initDatabase();

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [isRemoteConfigReady, setIsRemoteConfigReady] = useState(false);

  useEffect(() => {
    // Initialize Firebase Remote Config and fetch API base URL
    const initRemoteConfig = async () => {
      try {
        const baseUrl = await initializeApiWithRemoteConfig();
        console.log('Firebase Remote Config initialized successfully');
        console.log('API Base URL from Remote Config (ES_001):', baseUrl);
      } catch (error) {
        console.error('Failed to initialize Remote Config:', error);
      } finally {
        setIsRemoteConfigReady(true);
      }
    };

    initRemoteConfig();
  }, []);

  // Sync API base URL with Redux on app coming to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Sync API base URL with Redux state when app becomes active
        syncApiBaseUrlWithRedux();
        if (__DEV__) {
          console.log('App active - synced API base URL with Redux');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        persistor.flush();
        if (__DEV__) {
          console.log('App going to background - flushing persistor');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
          </View>
        }
        persistor={persistor}
      >
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <NavigationContainer>
            <Stack.Navigator initialRouteName="SplashScreen">
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="DocumentUpload"
                component={DocumentUploadScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Success"
                component={SuccessScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="FaceAndFingerEnrollment"
                component={FaceAndFingerEnrollmentScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="FaceRecongition"
                component={FaceRecongition}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="DashboardScreen"
                component={DashboardScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="SplashScreen"
                component={SplashScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="FingerCapture"
                component={FingerCaptureScreen}
                options={{ headerShown: false }}
              />

              <Stack.Screen
                name="FaceCapture"
                component={Tech5FaceCaptureScreen}
                options={{ headerShown: false }}
              />

            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
