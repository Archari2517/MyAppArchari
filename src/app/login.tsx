import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      showAlert('แจ้งเตือน', 'กรุณากรอกชื่อผู้ใช้/อีเมล และรหัสผ่าน');
      return;
    }

    setSubmitting(true);
    const result = await login(identifier.trim(), password);
    setSubmitting(false);

    if (result.ok) {
      router.replace('/');
    } else {
      showAlert('เข้าสู่ระบบไม่สำเร็จ', result.message || 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F6FB" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.logoBox}>
            <ThemedText style={styles.logoIcon}>🚲</ThemedText>
          </View>
          <ThemedText style={styles.title}>MY APP Archari</ThemedText>
          <ThemedText style={styles.subtitle}>เข้าสู่ระบบเพื่อจัดการสินค้า</ThemedText>

          <View style={styles.form}>
            <ThemedText style={styles.label}>ชื่อผู้ใช้ หรือ อีเมล</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="เช่น admin หรือ user@email.com"
              placeholderTextColor="#94A0AE"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />

            <ThemedText style={styles.label}>รหัสผ่าน</ThemedText>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="รหัสผ่าน"
                placeholderTextColor="#94A0AE"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <ThemedText style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</ThemedText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, submitting && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.loginButtonText}>เข้าสู่ระบบ</ThemedText>
              )}
            </TouchableOpacity>

            {/* ➕ ปุ่มกดไปหน้า สมัครสมาชิก */}
            <TouchableOpacity 
              style={styles.registerLink} 
              onPress={() => router.push('/register')}
            >
              <ThemedText style={styles.registerLinkText}>
                ยังไม่มีบัญชี? <ThemedText style={styles.registerBold}>สมัครสมาชิก</ThemedText>
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F6FB',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#FFE3C8',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#14171C',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#5B6472',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3A4250',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F2F6FB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 2,
    borderColor: '#14171C',
    color: '#14171C',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F6FB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#14171C',
    paddingRight: 6,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    height: 46,
    color: '#14171C',
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 16,
  },
  loginButton: {
    marginTop: 22,
    backgroundColor: '#FF6A13',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 6,
  },
  registerLinkText: {
    fontSize: 13,
    color: '#5B6472',
  },
  registerBold: {
    color: '#FF6A13',
    fontWeight: '700',
  },
});