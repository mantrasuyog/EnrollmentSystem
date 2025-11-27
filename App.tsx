import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';

import HomeScreen from './src/screens/HomeScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import FaceRecongition from './src/screens/FaceRecongition';
import FaceAndFingerEnrollmentScreen from './src/screens/FaceAndFingerEnrollmentScreen';
import SplashScreen from './src/screens/SplashScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DocumentUploadScreen from './src/screens/DocumentUploadScreen';
import FingerCaptureScreen from './src/screens/FingerCaptureScreen';
import Tech5FaceCaptureScreen from './src/screens/Tech5FaceCaptureScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import VerificationResultScreen from './src/screens/VerificationResultScreen';

import type { RootStackParamList } from './src/screens/HomeScreen';
import { store } from './src/redux/store';



const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
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
              name="faceCapture"
              component={Tech5FaceCaptureScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="VerificationScreen"
              component={VerificationScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="VerificationResult"
              component={VerificationResultScreen}
              options={{ headerShown: false }}
            />

          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
