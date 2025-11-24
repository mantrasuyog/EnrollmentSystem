import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import SuccessScreen from './src/screens/SuccessScreen'; 
import FaceRecongition from './src/screens/FaceRecongition'; 
import FaceAndFingerEnrollmentScreen from './src/screens/FaceAndFingerEnrollmentScreen';
import SplashScreen from './src/screens/SplashScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DocumentUploadScreen from './src/screens/DocumentUploadScreen';
import type { RootStackParamList } from './src/screens/HomeScreen'; //SplashScreen

import { Provider } from 'react-redux';
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


          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
