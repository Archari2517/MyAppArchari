import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL, useAuth } from '@/context/auth-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userImg, setUserImg] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    if (user?.id) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${user?.id}`);
      const data = await response.json();
      if (response.ok) {
        setUserName(data.user_name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setUserImg(data.user_img || null);
      }
    } catch (e) {
      showAlert('ข้อผิดพลาด', 'ดึงข้อมูลโปรไฟล์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const saveImageToDb = async (imgData: string) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${user?.id}/image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_img: imgData }),
      });

      if (response.ok) {
        setUserImg(imgData);
        showAlert('สำเร็จ', 'อัปเดตรูปโปรไฟล์เรียบร้อยแล้ว');
        setShowUrlInput(false);
        setImageUrlInput('');
      } else {
        showAlert('ข้อผิดพลาด', 'อัปเดตรูปภาพไม่สำเร็จ');
      }
    } catch (e) {
      showAlert('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setSaving(false);
    }
  };

  const pickImageFromDevice = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('แจ้งเตือน', 'กรุณายินยอมให้เข้าถึงคลังภาพ');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await saveImageToDb(base64Image);
    }
  };

  const handleSaveUrlImage = () => {
    if (!imageUrlInput.trim()) {
      showAlert('แจ้งเตือน', 'กรุณากรอก URL ของรูปภาพ');
      return;
    }
    saveImageToDb(imageUrlInput.trim());
  };

  const handleUpdate = async () => {
    if (!userName.trim() || !email.trim()) {
      showAlert('แจ้งเตือน', 'กรุณากรอกชื่อผู้ใช้และอีเมล');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profile/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_name: userName, email, phone }),
      });

      if (response.ok) {
        showAlert('สำเร็จ', 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว');
      } else {
        const data = await response.json();
        showAlert('ข้อผิดพลาด', data.error || 'บันทึกไม่สำเร็จ');
      }
    } catch (e) {
      showAlert('ข้อผิดพลาด', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    const doLogout = () => {
      logout();
      router.replace('/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('ต้องการออกจากระบบใช่หรือไม่?')) doLogout();
    } else {
      Alert.alert('ออกจากระบบ', `ออกจากระบบ (${user?.user_name || 'ผู้ใช้'}) ใช่หรือไม่?`, [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ออกจากระบบ', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  // 🔙 ฟังก์ชันสำหรับกดปุ่มย้อนกลับอย่างปลอดภัย
  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/'); // ถ้าไม่มีหน้าก่อนหน้า ให้กลับไปหน้าแรกสุด
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#B4693E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔙 ปุ่มย้อนกลับมุมบนซ้าย */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <ThemedText style={styles.backIcon}>←</ThemedText>
          <ThemedText style={styles.backText}>ย้อนกลับ</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 📷 แสดงรูปโปรไฟล์ปัจจุบัน */}
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri: userImg || 'https://i.pravatar.cc/100?img=47',
            }}
            style={styles.avatarImage}
          />
        </View>

        {/* 🔘 ปุ่มเลือกวิธีเปลี่ยนรูป */}
        <View style={styles.imageActionBox}>
          <TouchableOpacity style={styles.actionBtn} onPress={pickImageFromDevice} disabled={saving}>
            <ThemedText style={styles.actionBtnText}>📁 เลือกรูปจากเครื่อง</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setShowUrlInput(!showUrlInput)}>
            <ThemedText style={styles.actionBtnOutlineText}>🔗 ใส่ลิงก์ URL รูปภาพ</ThemedText>
          </TouchableOpacity>
        </View>

        {/* 🔗 กล่องกรอก URL */}
        {showUrlInput && (
          <View style={styles.urlBox}>
            <TextInput
              style={styles.input}
              placeholder="วาง URL รูปภาพที่นี่..."
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
            />
            <TouchableOpacity style={styles.saveUrlBtn} onPress={handleSaveUrlImage} disabled={saving}>
              <ThemedText style={styles.btnText}>ใช้รูปนี้</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        <ThemedText style={styles.roleBadge}>
          สิทธิ์การใช้งาน: {user?.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้ทั่วไป'}
        </ThemedText>

        <View style={styles.form}>
          <ThemedText style={styles.label}>ชื่อผู้ใช้</ThemedText>
          <TextInput style={styles.input} value={userName} onChangeText={setUserName} />

          <ThemedText style={styles.label}>อีเมล</ThemedText>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

          <ThemedText style={styles.label}>เบอร์โทรศัพท์</ThemedText>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleUpdate}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#FFF" /> : <ThemedText style={styles.btnText}>บันทึกการเปลี่ยนแปลง</ThemedText>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <ThemedText style={styles.logoutText}>ออกจากระบบ</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF3EA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    gap: 6,
  },
  backIcon: { fontSize: 16, fontWeight: '700', color: '#B4693E' },
  backText: { fontSize: 14, fontWeight: '600', color: '#B4693E' },
  content: { padding: 24, paddingTop: 10, alignItems: 'center' },
  avatarWrapper: { marginBottom: 12 },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#B4693E' },
  imageActionBox: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionBtn: { backgroundColor: '#B4693E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  actionBtnOutline: { borderWidth: 1, borderColor: '#B4693E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnOutlineText: { color: '#B4693E', fontSize: 12, fontWeight: '700' },
  urlBox: { width: '100%', marginBottom: 16, gap: 8 },
  saveUrlBtn: { backgroundColor: '#8C6A52', height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  roleBadge: { fontSize: 13, color: '#9C8776', marginBottom: 20 },
  form: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#6B4A34',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: { fontSize: 12, fontWeight: '700', color: '#8C6A52', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#FAF3EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    color: '#4A3628',
  },
  saveBtn: {
    backgroundColor: '#B4693E',
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  disabledBtn: { opacity: 0.7 },
  btnText: { color: '#FFF', fontWeight: '700' },
  logoutBtn: {
    backgroundColor: '#FFEBEB',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  logoutText: { color: '#E53935', fontWeight: '700' },
});