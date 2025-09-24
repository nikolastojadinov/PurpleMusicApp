import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import SongItem from '../components/SongItem';

// Mock data for demonstration
const mockSongs = [
  {
    id: '1',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    cover: '🎵',
  },
  {
    id: '2',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    cover: '🎶',
  },
  {
    id: '3',
    title: 'Levitating',
    artist: 'Dua Lipa',
    cover: '🎤',
  },
  {
    id: '4',
    title: 'Good 4 U',
    artist: 'Olivia Rodrigo',
    cover: '🎸',
  },
  {
    id: '5',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    cover: '🎧',
  },
  {
    id: '6',
    title: 'Industry Baby',
    artist: 'Lil Nas X & Jack Harlow',
    cover: '🎼',
  },
  {
    id: '7',
    title: 'Bad Habits',
    artist: 'Ed Sheeran',
    cover: '🎺',
  },
  {
    id: '8',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    cover: '🎹',
  },
];

export default function HomeScreen({ navigation }) {
  const handleSongPress = (song) => {
    navigation.navigate('Player', { song });
  };

  const renderSongItem = ({ item }) => (
    <SongItem song={item} onPress={() => handleSongPress(item)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Your Music Library</Text>
      </View>
      
      <FlatList
        data={mockSongs}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  listContainer: {
    paddingVertical: 10,
  },
});