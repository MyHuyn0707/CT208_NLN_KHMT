import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useApiClient } from '../../services/api';
import { profileStyles } from '../../assets/styles/profile.styles';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';

const ProfileScreen = () => {
  const { signOut, isSignedIn } = useAuth();
  const api = useApiClient();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Fetch thông tin hồ sơ khi màn hình được tải
  useEffect(() => {
    fetchProfile();
  }, []);
  
  // Lấy thông tin hồ sơ từ API
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Kiểm tra token trước
      const tokenCheck = await api.verifyToken();
      if (!tokenCheck.valid) {
        throw new Error('Invalid authentication token');
      }
      
      // Lấy thông tin hồ sơ
      const profileData = await api.getProfile();
      setProfile(profileData);
      
      // Cập nhật state với dữ liệu hồ sơ
      setName(profileData.name || '');
      setBio(profileData.bio || '');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Cập nhật hồ sơ
  const handleUpdateProfile = async () => {
    try {
      setUpdateLoading(true);
      setError(null);
      
      // Gọi API cập nhật hồ sơ
      const updatedProfile = await api.updateProfile({ name, bio });
      
      // Cập nhật state với dữ liệu mới
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Xử lý đăng xuất
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };
  
  // Hiển thị màn hình loading
  if (loading) {
    return (
      <View style={profileStyles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={profileStyles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  // Hiển thị màn hình lỗi
  if (error) {
    return (
      <View style={profileStyles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={profileStyles.errorText}>{error}</Text>
        <TouchableOpacity style={profileStyles.retryButton} onPress={fetchProfile}>
          <Text style={profileStyles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={profileStyles.container}>
      {/* Phần đầu profile */}
      <View style={profileStyles.header}>
        {profile?.avatarUrl ? (
          <Image
            source={{ uri: profile.avatarUrl }}
            style={profileStyles.avatar}
          />
        ) : (
          <View style={profileStyles.avatarPlaceholder}>
            <Text style={profileStyles.avatarPlaceholderText}>
              {profile?.name?.charAt(0) || '?'}
            </Text>
          </View>
        )}
        
        <View style={profileStyles.headerInfo}>
          {!isEditing ? (
            <>
              <Text style={profileStyles.name}>{profile?.name || 'No name'}</Text>
              <Text style={profileStyles.email}>{profile?.email}</Text>
            </>
          ) : (
            <Text style={profileStyles.editTitle}>Edit Profile</Text>
          )}
        </View>
        
        {!isEditing ? (
          <TouchableOpacity 
            style={profileStyles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="pencil-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Phần chỉnh sửa hoặc hiển thị thông tin */}
      {!isEditing ? (
        <View style={profileStyles.infoContainer}>
          <View style={profileStyles.infoRow}>
            <Text style={profileStyles.infoLabel}>Bio</Text>
            <Text style={profileStyles.infoValue}>{profile?.bio || 'No bio yet'}</Text>
          </View>
          
          <View style={profileStyles.infoRow}>
            <Text style={profileStyles.infoLabel}>Email Verified</Text>
            <View style={profileStyles.verifiedBadge}>
              <Ionicons 
                name={profile?.emailVerified ? "checkmark-circle" : "close-circle"} 
                size={18} 
                color={profile?.emailVerified ? COLORS.success : COLORS.error} 
              />
              <Text style={[
                profileStyles.verifiedText,
                { color: profile?.emailVerified ? COLORS.success : COLORS.error }
              ]}>
                {profile?.emailVerified ? 'Verified' : 'Not Verified'}
              </Text>
            </View>
          </View>
          
          <View style={profileStyles.infoRow}>
            <Text style={profileStyles.infoLabel}>Role</Text>
            <Text style={profileStyles.infoValue}>{profile?.role || 'User'}</Text>
          </View>
          
          <View style={profileStyles.infoRow}>
            <Text style={profileStyles.infoLabel}>Joined</Text>
            <Text style={profileStyles.infoValue}>
              {profile?.createdAt 
                ? new Date(profile.createdAt).toLocaleDateString() 
                : 'Unknown'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={profileStyles.editContainer}>
          <View style={profileStyles.inputGroup}>
            <Text style={profileStyles.inputLabel}>Name</Text>
            <TextInput
              style={profileStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />
          </View>
          
          <View style={profileStyles.inputGroup}>
            <Text style={profileStyles.inputLabel}>Bio</Text>
            <TextInput
              style={[profileStyles.input, profileStyles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              multiline={true}
              numberOfLines={4}
            />
          </View>
          
          <View style={profileStyles.buttonContainer}>
            <TouchableOpacity
              style={profileStyles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                setName(profile?.name || '');
                setBio(profile?.bio || '');
              }}
              disabled={updateLoading}
            >
              <Text style={profileStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                profileStyles.saveButton,
                updateLoading && profileStyles.disabledButton
              ]}
              onPress={handleUpdateProfile}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={profileStyles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Đăng xuất */}
      <TouchableOpacity
        style={profileStyles.signOutButton}
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
        <Text style={profileStyles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;