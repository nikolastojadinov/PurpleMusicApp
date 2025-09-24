import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PlayerScreen({ route }) {
  const { song } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45);
  const [duration] = useState(180);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentTime / duration) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.coverSection}>
        <View style={styles.coverContainer}>
          <Text style={styles.coverEmoji}>{song.cover}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.songTitle}>{song.title}</Text>
        <Text style={styles.artistName}>{song.artist}</Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          <View style={[styles.progressThumb, { left: `${progressPercentage}%` }]} />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.controlsSection}>
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="play-skip-back" size={32} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={36} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="play-skip-forward" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="shuffle" size={24} color="#CCCCCC" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="repeat" size={24} color="#CCCCCC" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="heart-outline" size={24} color="#CCCCCC" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 30,
  },
  coverSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  coverContainer: {
    width: 280,
    height: 280,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9C4DCC',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  coverEmoji: {
    fontSize: 120,
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  songTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  progressSection: {
    paddingVertical: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    marginBottom: 10,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9C4DCC',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#9C4DCC',
    borderRadius: 8,
    marginLeft: -8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  controlButton: {
    padding: 15,
  },
  playButton: {
    width: 80,
    height: 80,
    backgroundColor: '#9C4DCC',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
    shadowColor: '#9C4DCC',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconButton: {
    padding: 10,
  },
});