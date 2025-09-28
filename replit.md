# PurpleMusic - Music Streaming App

## Overview

A dark-themed mobile music streaming app built with React featuring PurpleMusic branding. Features black background, transparent white header with custom logo and profile dropdown, bottom navigation with Home, Search, Liked Songs, and My Playlists sections, complete music player functionality with mini-player and full-screen player, and homepage with horizontal scroll sections for Recently Played, Made for You, and Trending Now content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18.2.0 with React Router for navigation
- **Navigation**: React Router DOM with stack-based routing pattern
- **UI Components**: Custom component architecture with Header and BottomNavigation components
- **Styling**: CSS-based styling with dark theme and Spotify-like design patterns

### Screen Structure
- **HomeScreen**: Main interface with search bar and horizontal scroll sections
- **SearchScreen**: Search interface with recent and trending searches
- **LikedSongsScreen**: Playlist-style interface for liked songs
- **PlaylistsScreen**: User's playlists management interface
- **Navigation Flow**: React Router managing transitions between all screens

### Component Architecture
- **Header Component**: Transparent white header with logo and profile icon
- **BottomNavigation Component**: Fixed bottom navigation with 4 main sections
- **Modular Design**: Clear separation between screens and components for maintainability
- **State Management**: Local component state using React hooks (useState)

### Design System
- **Theme**: Dark mode design with black background (#000000)
- **Color Palette**: Spotify green (#1DB954), gradients for visual interest
- **Typography**: Modern typography with proper text hierarchy and contrast
- **Layout**: Mobile-first responsive design with sticky header and bottom navigation

### Data Management
- **Mock Data**: Currently uses hardcoded data for playlists, songs, and content
- **Data Structure**: Objects contain id, title, artist, covers (emoji-based), and metadata
- **Backend Integration**: Express server provides Pi Network payment APIs and user authentication

## Backend Architecture
### Express Server
- **Framework**: Express.js with CORS and body-parser middleware
- **Port**: Runs on port 8080 (configurable via PORT environment variable)
- **APIs**: Pi Network payment verification endpoints and user authentication
- **Database**: Supabase integration for user management and premium status

### Payment Integration
- **Pi Network**: Complete payment flow with approve/complete pattern
- **Endpoints**: `/api/verify-payment`, `/api/payments/approve`, `/api/payments/complete`
- **Authentication**: Requires PI_API_KEY and SUPABASE_SERVICE_KEY environment variables

## Replit Environment Setup
### Development Configuration
- **Frontend**: React dev server on port 5000 with host verification disabled for Replit proxy
- **Backend**: Express server on port 8080 with local development support
- **Proxy**: Configured to work with Replit's iframe-based preview system
- **Host Settings**: `DANGEROUSLY_DISABLE_HOST_CHECK=true` and `HOST=0.0.0.0` for React

### Deployment Configuration
- **Target**: Autoscale deployment for stateless web application
- **Build**: `npm run build` for React production build
- **Runtime**: `npm start` runs backend server for production

## External Dependencies

### Core React Stack
- **react**: 18.2.0 - React library for component architecture
- **react-dom**: 18.2.0 - React DOM for web platform
- **react-scripts**: Latest - Create React App build tools

### Navigation Libraries
- **react-router-dom**: Latest - Client-side routing for React web applications

### Development Tools
- **@types/react**: Type definitions for React components
- **@types/react-dom**: Type definitions for React DOM
- **css-select**: CSS selector library
- **nth-check**: CSS nth-child selector parsing
- **serve**: Static file serving for production builds
- **svgo**: SVG optimization tools

## Recent Changes

### September 28, 2025
- **Replit Setup**: Configured for Replit development environment
- **Dependencies**: Installed all frontend (React) and backend (Express) dependencies
- **Host Configuration**: Set up React dev server to work with Replit proxy
- **Workflow**: Configured frontend workflow on port 5000
- **Backend**: Set up Express server on port 8080 (separate from frontend)
- **Deployment**: Configured autoscale deployment with proper build/run commands

### September 25, 2025
- Complete redesign from React Native to React web application
- Implemented Spotify-like dark theme interface with black background
- Added transparent white header with logo and profile icon
- Created bottom navigation with Home, Search, Liked Songs, and Playlists sections
- Built homepage with search bar and horizontal scroll sections (Recently Played, Made for You, Trending Now)
- Developed dedicated pages for Search, Liked Songs, and Playlists functionality
- Applied mobile-first responsive design patterns

Note: The application is a design-only interface using mock data. No actual audio playback functionality is implemented. Future iterations may require audio libraries, state management solutions, and backend integration for real music streaming capabilities.