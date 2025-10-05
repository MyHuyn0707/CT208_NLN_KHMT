import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useApiClient } from '../../services/api';
import { COLORS } from '../../constants/colors';

const ApiTestScreen = () => {
  const api = useApiClient();
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const testHealthCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Testing health check API...");
      const response = await fetch("http://localhost:5001/health");
      const data = await response.json();
      console.log("Health check response:", data);
      
      setHealthStatus(data);
    } catch (err) {
      console.error("Health check error:", err);
      setError(err.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };
  
  const testAuthAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Testing auth API...");
      const data = await api.verifyToken();
      console.log("Auth API response:", data);
      
      setHealthStatus(data);
    } catch (err) {
      console.error("Auth API error:", err);
      setError(err.message || "Failed to verify token");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={testHealthCheck}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Health Check</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.authButton, loading && styles.buttonDisabled]} 
          onPress={testAuthAPI}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Auth API</Text>
        </TouchableOpacity>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Testing connection...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {healthStatus && !error && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Connection Successful</Text>
          <Text style={styles.resultText}>
            {JSON.stringify(healthStatus, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  authButton: {
    backgroundColor: '#4285F4',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textDark,
  },
  errorContainer: {
    backgroundColor: '#FFEEEE',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginVertical: 16,
  },
  errorTitle: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: COLORS.textDark,
    fontSize: 16,
  },
  resultContainer: {
    backgroundColor: '#EEFFF0',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginVertical: 16,
  },
  resultTitle: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    color: COLORS.textDark,
    fontSize: 14,
    fontFamily: 'monospace',
  }
});

export default ApiTestScreen;