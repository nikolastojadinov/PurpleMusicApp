import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function SongItem({ song, onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.coverContainer}>
        <Text style={styles.coverEmoji}>{song.cover}</Text>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist}
        </Text>
      </View>
      
      <View style={styles.playIndicator}>
        <Text style={styles.playIcon}>▶</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  coverContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  coverEmoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '400',
  },
  playIndicator: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 16,
    color: '#9C4DCC',
    fontWeight: 'bold',
  },
});