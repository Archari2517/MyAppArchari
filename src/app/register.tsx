import { useState } from 'react';
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
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { API_BASE_URL } from '@/context/auth-context';

export default function RegisterScreen() {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State สำหรับเก็บรูปภาพโปรไฟล์
  const [userImg, setUserImg] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 1. เลือกรูปจากเครื่อง
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
      setUserImg(base64Image);
      setShowUrlInput(false);
    }
  };

  // 2. ใช้รูปจาก URL
  const handleApplyUrlImage = () => {
    if (!imageUrlInput.trim()) {
      showAlert('แจ้งเตือน', 'กรุณากรอก URL ของรูปภาพ');
      return;
    }
    setUserImg(imageUrlInput.trim());
    setShowUrlInput(false);
  };

  // 3. ฟังก์ชันลงทะเบียนสมัครสมาชิก
  const handleRegister = async () => {
    if (!userName.trim() || !email.trim() || !password.trim()) {
      showAlert('แจ้งเตือน', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('แจ้งเตือน', 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: userName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password: password.trim(),
          user_img: userImg, // 👈 ส่งข้อมูลรูปภาพไปด้วย
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('สำเร็จ', 'สมัครสมาชิกเรียบร้อยแล้ว กรุณาเข้าสู่ระบบ');
        router.replace('/login');
      } else {
        showAlert('สมัครสมาชิกไม่สำเร็จ', data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (e) {
      showAlert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.title}>สมัครสมาชิก</ThemedText>
        <ThemedText style={styles.subtitle}>กรอกข้อมูลเพื่อสร้างบัญชีใหม่</ThemedText>

        {/* 📷 แสดงรูปตัวอย่าง */}
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri: userImg || 'https://i.pravatar.cc/100?img=47',
            }}
            style={styles.avatarImage}
          />
        </View>

        {/* 🔘 ปุ่มเลือกวิธีใส่รูปโปรไฟล์ */}
        <View style={styles.imageActionBox}>
          <TouchableOpacity style={styles.actionBtn} onPress={pickImageFromDevice}>
            <ThemedText style={styles.actionBtnText}>📁 เลือกรูปจากเครื่อง</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtnOutline} onPress={() => setShowUrlInput(!showUrlInput)}>
            <ThemedText style={styles.actionBtnOutlineText}>🔗 ใส่ลิงก์ URL</ThemedText>
          </TouchableOpacity>
        </View>

        {/* 🔗 ช่องกรอก URL (แสดงเมื่อกดปุ่มใส่ลิงก์) */}
        {showUrlInput && (
          <View style={styles.urlBox}>
            <TextInput
              style={styles.input}
              placeholder="วาง URL รูปภาพที่นี่..."
              value={imageUrlInput}
              onChangeText={setImageUrlInput}
            />
            <TouchableOpacity style={styles.applyUrlBtn} onPress={handleApplyUrlImage}>
              <ThemedText style={styles.btnText}>ใช้รูปนี้</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* 📝 ฟอร์มสมัครสมาชิก */}
        <View style={styles.form}>
          <ThemedText style={styles.label}>ชื่อผู้ใช้ *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="ระบุชื่อผู้ใช้"
            value={userName}
            onChangeText={setUserName}
          />

          <ThemedText style={styles.label}>อีเมล *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <ThemedText style={styles.label}>เบอร์โทรศัพท์</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="08X-XXX-XXXX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <ThemedText style={styles.label}>รหัสผ่าน *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="ตั้งรหัสผ่าน"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <ThemedText style={styles.label}>ยืนยันรหัสผ่าน *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <ThemedText style={styles.registerBtnText}>สมัครสมาชิก</ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/login')}>
            <ThemedText style={styles.loginLinkText}>มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF3EA' },
  content: { padding: 24, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#3D2B1F', marginTop: 10 },
  subtitle: { fontSize: 13, color: '#9C8776', marginBottom: 20 },
  avatarWrapper: { marginBottom: 10 },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#B4693E' },
  imageActionBox: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionBtn: { backgroundColor: '#B4693E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  actionBtnOutline: { borderWidth: 1, borderColor: '#B4693E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  actionBtnOutlineText: { color: '#B4693E', fontSize: 12, fontWeight: '700' },
  urlBox: { width: '100%', marginBottom: 16, gap: 8 },
  applyUrlBtn: { backgroundColor: '#8C6A52', height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '700' },
  form: { width: '100%' },
  label: { fontSize: 12, fontWeight: '700', color: '#8C6A52', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    color: '#4A3628',
  },
  registerBtn: {
    backgroundColor: '#B4693E',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  disabledBtn: { opacity: 0.7 },
  registerBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  loginLink: { marginTop: 16, alignItems: 'center' },
  loginLinkText: { color: '#B4693E', fontSize: 13, fontWeight: '600' },
});