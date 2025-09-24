import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import PlayerScreen from './screens/PlayerScreen';

const Stack = createStackNavigator();

const theme = {
  dark: true,
  colors: {
    primary: '#9C4DCC',     // Purple accent
    background: '#0A0A0A',  // Very dark background
    card: '#1A1A1A',       // Slightly lighter for cards
    text: '#FFFFFF',       // White text
    border: '#2A2A2A',     // Border color
    notification: '#9C4DCC', // Purple for notifications
  },
};

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#0A0A0A" />
      <NavigationContainer theme={theme}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0A0A0A',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#2A2A2A',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 20,
            },
            headerBackTitleVisible: false,
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ 
              title: 'MobileBeats',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 24,
                color: '#9C4DCC',
              }
            }}
          />
          <Stack.Screen 
            name="Player" 
            component={PlayerScreen}
            options={{ 
              title: 'Now Playing',
              headerTitleStyle: {
                fontWeight: '600',
                fontSize: 18,
              }
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}