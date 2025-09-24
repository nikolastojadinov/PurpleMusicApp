# MobileBeats - React Native Music Player App

## Overview

MobileBeats is a React Native mobile music player application built with Expo. The app provides a modern music streaming interface with a dark purple theme, featuring a home screen with song listings and a dedicated player screen for music playback. The application uses React Navigation for screen transitions and includes mock song data for demonstration purposes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK ~51.0.28
- **Navigation**: React Navigation v6 with stack-based navigation pattern
- **UI Components**: Custom component architecture with reusable SongItem components
- **Styling**: StyleSheet-based styling with consistent dark theme throughout

### Screen Structure
- **HomeScreen**: Main listing interface displaying available songs in a FlatList
- **PlayerScreen**: Dedicated music player interface with playback controls and progress tracking
- **Navigation Flow**: Stack navigator managing transitions between Home and Player screens

### Component Architecture
- **SongItem Component**: Reusable list item component for displaying song metadata
- **Modular Design**: Clear separation between screens and components for maintainability
- **State Management**: Local component state using React hooks (useState)

### Design System
- **Theme**: Dark mode design with purple accent colors (#9C4DCC)
- **Color Palette**: Consistent color scheme defined in navigation theme
- **Typography**: Bold headers with proper text hierarchy
- **Layout**: Safe area handling and responsive design principles

### Data Management
- **Mock Data**: Currently uses hardcoded song data for demonstration
- **Data Structure**: Song objects contain id, title, artist, and emoji-based cover art
- **No Persistence**: No database or local storage implementation currently

## External Dependencies

### Core React Native Stack
- **react-native**: 0.74.5 - Core React Native framework
- **expo**: ~51.0.28 - Expo development platform and SDK
- **react**: 18.2.0 - React library for component architecture

### Navigation Libraries
- **@react-navigation/native**: ^6.1.7 - Core navigation functionality
- **@react-navigation/stack**: ^6.3.17 - Stack navigation implementation
- **react-native-screens**: ~3.31.1 - Native screen management
- **react-native-safe-area-context**: 4.10.5 - Safe area handling

### UI and Interaction
- **@expo/vector-icons**: ^14.0.2 - Icon library for UI elements
- **react-native-gesture-handler**: ~2.16.1 - Gesture recognition and handling
- **expo-status-bar**: ~1.12.1 - Status bar configuration

### Development Tools
- **@babel/core**: ^7.20.0 - JavaScript compiler for React Native
- **@expo/metro-runtime**: ~3.2.3 - Metro bundler runtime for Expo

### Web Support
- **react-dom**: 18.2.0 - React DOM for web platform support
- **react-native-web**: ~0.19.10 - Web implementation of React Native components

Note: The application currently lacks audio playback functionality and uses mock data. Future iterations may require audio libraries, state management solutions, and backend integration for real music streaming capabilities.