import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, Modal, Platform, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCard, type Product } from '@/components/product-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL, useAuth } from '@/context/auth-context';
import generatePayload from 'promptpay-qr';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef, useState } from 'react';

// กำหนดเบอร์ PromptPay หรือ เลขประจำตัวผู้เสียภาษี ของร้านตรงนี้
const MERCHANT_PROMPTPAY_NO = '0927902948';
const PRODUCTS_URL = `${API_BASE_URL}/Inventory`;
const CATEGORIES_URL = `${PRODUCTS_URL}/categories`;
const UPLOAD_URL = `${API_BASE_URL}/upload`;
const ORDERS_URL = `${API_BASE_URL}/orders`;

// สถานะคำสั่งซื้อที่ใช้กรองในหน้า Admin
type OrderStatus = 'pending' | 'approved' | 'rejected';
interface AdminOrder {
  id: number;
  user_id: number;
  total_amount: number;
  slip_url: string;
  status: OrderStatus;
  created_at: string;
  user_name?: string;
  email?: string;
  phone?: string;
  shipping_address?: string;
}


// ---- Bike shop design tokens: vivid orange + navy + electric blue, bold ink borders ----
const colors = {
  surface: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F2F6FB',
  surfaceContainer: '#E9F0F8',
  surfaceContainerHigh: '#DCE6F2',
  onSurface: '#14171C',
  onSurfaceVariant: '#5B6472',
  outline: '#8A93A3',
  outlineVariant: '#14171C',
  primary: '#FF6A13',
  onPrimary: '#FFFFFF',
  primaryContainer: '#0B1F4D',
  onPrimaryContainer: '#FFE3C8',
  secondary: '#1E4FE0',
  onSecondary: '#FFFFFF',
  secondaryFixed: '#DCE6FF',
  onSecondaryFixedVariant: '#123A9E',
  errorContainer: '#FFD9D9',
  onErrorContainer: '#B3111F',
  tertiaryFixed: '#FFE1CC',
};

const headlineSerif = Platform.select({
  ios: 'ui-serif',
  android: 'serif',
  default: 'serif',
});

// ข้อมูลแบนเนอร์ Featured Collections
const FEATURED_COLLECTIONS = [
  {
    eyebrow: 'CURATED COLLECTION',
    title: 'Family Adventures',
    subtitle: 'Discover stories that bring the whole family together.',
    image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&q=80',
  },
  {
    eyebrow: 'NEW ARRIVALS',
    title: 'Fresh Off The Shelf',
    subtitle: 'The latest additions, picked just for you.',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
  },
  {
    eyebrow: 'STAFF PICKS',
    title: 'Weekend Favorites',
    subtitle: 'Handpicked reads to make your weekend brighter.',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
  },
];

export default function HomeScreen() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [avatarError, setAvatarError] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [bannerWidth, setBannerWidth] = useState(Dimensions.get('window').width - 40);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ---- ส่วนจัดการคำสั่งซื้อ (Orders) สำหรับ Admin ----
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | OrderStatus>('pending');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string>('');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<number>>(new Set());

  const toggleOrderAddress = (orderId: number) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // ---- ส่วนรถเข็น (Cart) & ชำระเงิน (QR Code & Slip) ----
  const [cartItems, setCartItems] = useState<{ product: Product; qty: number }[]>([]);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [slipImage, setSlipImage] = useState<string>('');
  const [isUploadingSlip, setIsUploadingSlip] = useState<boolean>(false);
  const [shippingAddress, setShippingAddress] = useState('');

  const cartCount = cartItems.reduce((sum, it) => sum + it.qty, 0);
  const cartTotal = cartItems.reduce((sum, it) => sum + it.qty * it.product.price, 0);

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, qty: it.qty + 1 } : it
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) =>
          it.product.id === productId ? { ...it, qty: it.qty + delta } : it
        )
        .filter((it) => it.qty > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setSlipImage('');
    setCartModalVisible(false);
    setQrModalVisible(true);
  };

  const pickSlipImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('แจ้งเตือน', 'กรุณาอนุญาตให้เข้าถึงคลังรูปภาพก่อน');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const fileName = asset.fileName || asset.uri.split('/').pop() || `slip-${Date.now()}.jpg`;
    const fileType = asset.mimeType || 'image/jpeg';

    const formData = new FormData();
    if (Platform.OS === 'web') {
      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();
      formData.append('image', blob, fileName);
    } else {
      formData.append('image', {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      } as any);
    }

    setIsUploadingSlip(true);
    try {
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        showAlert('อัปโหลดไม่สำเร็จ', data.error || 'ไม่สามารถอัปโหลดรูปสลิปได้');
        return;
      }
      setSlipImage(data.url);
    } catch (error) {
      console.error('Upload slip error:', error);
      showAlert('อัปโหลดไม่สำเร็จ', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleFinishPayment = async () => {
    if (!slipImage) {
      showAlert('แจ้งเตือน', 'กรุณาแนบสลิปการโอนเงินก่อนยืนยัน');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          total_amount: cartTotal,
          slip_url: slipImage,
          shipping_address: shippingAddress,
        }),
      });

      if (response.ok) {
        showAlert('ชำระเงินสำเร็จ', `ขอบคุณที่อุดหนุนค่ะ/ครับ ยอดชำระ ฿${cartTotal.toLocaleString()}`);
        setCartItems([]);
        setSlipImage('');
        setShippingAddress('');
        setQrModalVisible(false);
      } else {
        showAlert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลการชำระเงินได้');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showAlert('ผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  // State สำหรับค้นหา / กรอง
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [draftCategory, setDraftCategory] = useState('');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');

  // State สำหรับฟอร์มเพิ่ม/แก้ไข สินค้า
  const [bikeName, setBikeName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const uploadSessionRef = useRef(0);

  const loadProducts = async (opts?: {
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const search = opts?.search ?? searchQuery;
    const cat = opts?.category ?? selectedCategory;
    const min = opts?.minPrice ?? minPrice;
    const max = opts?.maxPrice ?? maxPrice;

    const params = new URLSearchParams();
    if (search.trim()) params.append('search', search.trim());
    if (cat.trim()) params.append('category', cat.trim());
    if (min.trim()) params.append('minPrice', min.trim());
    if (max.trim()) params.append('maxPrice', max.trim());

    const url = params.toString() ? `${PRODUCTS_URL}?${params.toString()}` : PRODUCTS_URL;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(CATEGORIES_URL);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadProducts();
      loadCategories();
      
    }
  }, [user]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      loadProducts({ search: text });
    }, 400);
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    loadProducts({ search: '' });
  };

  const openFilterModal = () => {
    setDraftCategory(selectedCategory);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setFilterModalVisible(true);
  };

  const applyFilters = () => {
    setSelectedCategory(draftCategory);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setFilterModalVisible(false);
    loadProducts({ category: draftCategory, minPrice: draftMinPrice, maxPrice: draftMaxPrice });
  };

  const resetFilters = () => {
    setDraftCategory('');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setFilterModalVisible(false);
    loadProducts({ category: '', minPrice: '', maxPrice: '' });
  };

  const activeFilterCount = (selectedCategory ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  const resetForm = () => {
    setBikeName('');
    setBrand('');
    setPrice('');
    setStockQty('');
    setCategory('');
    setImage('');
    setEditingProduct(null);
    uploadSessionRef.current += 1;
    setIsUploadingImage(false);
  };

  const pickImageFromDevice = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('แจ้งเตือน', 'กรุณาอนุญาตให้เข้าถึงคลังรูปภาพก่อน');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const fileName = asset.fileName || asset.uri.split('/').pop() || `photo-${Date.now()}.jpg`;
    const fileType = asset.mimeType || 'image/jpeg';

    const formData = new FormData();

    if (Platform.OS === 'web') {
      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();
      formData.append('image', blob, fileName);
    } else {
      formData.append('image', {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      } as any);
    }

    const sessionId = uploadSessionRef.current;
    setIsUploadingImage(true);
    try {
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        showAlert('อัปโหลดไม่สำเร็จ', data.error || 'เกิดข้อผิดพลาดในการอัปโหลดรูป');
        return;
      }
      if (sessionId !== uploadSessionRef.current) {
        return;
      }
      setImage(data.url);
    } catch (error) {
      console.error('Upload image error:', error);
      showAlert('อัปโหลดไม่สำเร็จ', 'ไม่สามารถเชื่อมต่อกับ server ได้');
    } finally {
      if (sessionId === uploadSessionRef.current) {
        setIsUploadingImage(false);
      }
    }
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setBikeName(product.bike_name);
    setBrand(product.brand);
    setPrice(product.price.toString());
    setStockQty(product.stock_qty.toString());
    setCategory(product.category);
    setImage(product.image);
    setModalVisible(true);
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSave = async () => {
    if (!bikeName) {
      showAlert('แจ้งเตือน', 'กรุณากรอกชื่อจักรยาน');
      return;
    }

    if (isUploadingImage) {
      showAlert('แจ้งเตือน', 'กรุณารอให้อัปโหลดรูปเสร็จก่อนกดบันทึก');
      return;
    }

    const payload = {
      bike_name: bikeName,
      brand,
      price: parseFloat(price) || 0,
      stock_qty: parseInt(stockQty) || 0,
      category,
      image: image || 'https://picsum.photos/seed/bicycle-placeholder/200/260',
    };

    try {
      if (editingProduct) {
        await fetch(`${PRODUCTS_URL}/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(PRODUCTS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setModalVisible(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const executeDelete = async (id: number) => {
    try {
      const response = await fetch(`${PRODUCTS_URL}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        loadProducts();
      } else {
        console.error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  // ดึงรายการคำสั่งซื้อทั้งหมด (กรองตามสถานะได้)
  const loadOrders = async (statusFilter?: 'all' | OrderStatus) => {
    const filter = statusFilter ?? orderStatusFilter;
    setOrdersLoading(true);
    try {
      const url = filter && filter !== 'all' ? `${ORDERS_URL}?status=${filter}` : ORDERS_URL;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleOpenOrders = () => {
    setOrdersModalVisible(true);
    loadOrders(orderStatusFilter);
  };

  const handleFilterOrders = (statusFilter: 'all' | OrderStatus) => {
    setOrderStatusFilter(statusFilter);
    loadOrders(statusFilter);
  };

  // อัปเดตสถานะคำสั่งซื้อ (Approve / Reject)
  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`${ORDERS_URL}/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        showAlert('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้');
        return;
      }
      // อัปเดต state ทันที และรีเฟรชตามตัวกรองปัจจุบัน (ออเดอร์ที่เปลี่ยนสถานะอาจหลุดจากรายการที่กรองอยู่)
      setOrders((prev) =>
        orderStatusFilter === 'all'
          ? prev.map((o) => (o.id === orderId ? { ...o, status } : o))
          : prev.filter((o) => o.id !== orderId)
      );
    } catch (error) {
      console.error('Update order status error:', error);
      showAlert('ผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleApproveOrder = (orderId: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('ยืนยันอนุมัติคำสั่งซื้อนี้ใช่หรือไม่?')) {
        updateOrderStatus(orderId, 'approved');
      }
    } else {
      Alert.alert('ยืนยันอนุมัติ', 'คุณต้องการอนุมัติคำสั่งซื้อนี้ใช่หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'อนุมัติ', onPress: () => updateOrderStatus(orderId, 'approved') },
      ]);
    }
  };

  const handleRejectOrder = (orderId: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('ยืนยันปฏิเสธคำสั่งซื้อนี้ใช่หรือไม่?')) {
        updateOrderStatus(orderId, 'rejected');
      }
    } else {
      Alert.alert('ยืนยันปฏิเสธ', 'คุณต้องการปฏิเสธคำสั่งซื้อนี้ใช่หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ปฏิเสธ', style: 'destructive', onPress: () => updateOrderStatus(orderId, 'rejected') },
      ]);
    }
  };

  const orderStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'approved':
        return { text: '✅ อนุมัติแล้ว', style: styles.orderStatusApproved };
      case 'rejected':
        return { text: '❌ ปฏิเสธแล้ว', style: styles.orderStatusRejected };
      default:
        return { text: '⏳ รอตรวจสอบ', style: styles.orderStatusPending };
    }
  };

  const handleDelete = (id: number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('คุณต้องการลบจักรยานคันนี้ใช่หรือไม่?');
      if (confirmed) {
        executeDelete(id);
      }
    } else {
      Alert.alert('ยืนยันการลบ', 'คุณต้องการลบจักรยานคันนี้ใช่หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบข้อมูล',
          style: 'destructive',
          onPress: () => executeDelete(id),
        },
      ]);
    }
  };

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Top Navigation */}
      <ThemedView style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <ThemedText style={styles.logoIcon}>🚲</ThemedText>
          </View>
          <View style={styles.titleWrap}>
            <ThemedText style={styles.headerTitle}>MY APP Archari</ThemedText>
            <View style={styles.userRow}>
              <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
                {user.user_name}
              </ThemedText>
              <View
                style={[
                  styles.roleBadge,
                  isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeUser,
                ]}
              >
                <ThemedText style={styles.roleBadgeText}>
                  {isAdmin ? '👑 Admin' : '👤 User'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.profileButton, isAdmin ? styles.profileButtonAdmin : styles.profileButtonUser]}
          onPress={() => router.push('/profile')}
          activeOpacity={0.75}
        >
          {user.user_img && !avatarError ? (
            <Image
              source={{ uri: user.user_img }}
              style={styles.profileImage}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View style={styles.profileFallback}>
              <ThemedText style={styles.profileFallbackText}>
                {user.user_name?.trim()?.charAt(0)?.toUpperCase() || '?'}
              </ThemedText>
            </View>
          )}
          {isAdmin && (
            <View style={styles.profileCrown}>
              <ThemedText style={styles.profileCrownIcon}>👑</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </ThemedView>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or category..."
            placeholderTextColor="#94A0AE"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => loadProducts({ search: searchQuery })}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <ThemedText style={styles.clearIcon}>✕</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={openFilterModal}>
          <ThemedText style={styles.filterIcon}>⚲</ThemedText>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ปุ่มกดเพิ่มสินค้า (เฉพาะ Admin) */}
      {isAdmin && (
        <View style={styles.addRow}>
          <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
            <ThemedText style={styles.addButtonIcon}>＋</ThemedText>
            <ThemedText style={styles.addButtonText}>Add Product</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Product List */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.shelfArea}
        data={products}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            <ThemedText style={styles.collectionsHeading}>Featured Collections</ThemedText>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              onLayout={(e) => setBannerWidth(e.nativeEvent.layout.width)}
              scrollEventThrottle={16}
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
                const clamped = Math.max(0, Math.min(index, FEATURED_COLLECTIONS.length - 1));
                setActiveBannerIndex((prev) => (prev === clamped ? prev : clamped));
              }}
            >
              {FEATURED_COLLECTIONS.map((item, idx) => (
                <View key={idx} style={[styles.bannerCard, { width: bannerWidth }]}>
                  <Image source={{ uri: item.image }} style={styles.bannerImage} resizeMode="cover" />
                  <View style={styles.bannerOverlay} />
                  <View style={styles.bannerContent}>
                    <ThemedText style={styles.bannerEyebrow}>{item.eyebrow}</ThemedText>
                    <ThemedText style={styles.bannerTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.bannerSubtitle}>{item.subtitle}</ThemedText>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.bannerDots}>
              {FEATURED_COLLECTIONS.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.bannerDot, idx === activeBannerIndex && styles.bannerDotActive]}
                />
              ))}
            </View>

            <View style={styles.sectionHeaderRow}>
              <ThemedText style={styles.sectionLabel}>
                {searchQuery || activeFilterCount > 0 ? 'Search Results' : 'Most popular'}
              </ThemedText>
              <ThemedText style={styles.sectionCount}>
                {searchQuery || activeFilterCount > 0
                  ? `${products.length} found`
                  : `${products.length} in shop`}
              </ThemedText>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>📭</ThemedText>
            <ThemedText style={styles.emptyText}>
              {searchQuery
                ? `ไม่พบสินค้าที่ตรงกับ "${searchQuery}"`
                : activeFilterCount > 0
                ? 'ไม่พบสินค้าที่ตรงกับตัวกรองที่เลือก'
                : 'ยังไม่มีสินค้า'}
            </ThemedText>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onEdit={isAdmin ? handleOpenEdit : undefined}
            onDelete={isAdmin ? handleDelete : undefined}
            onAddToCart={!isAdmin ? handleAddToCart : undefined}
          
          />
        )}
      />

      {/* Bottom Navigation */}
      <ThemedView style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <ThemedText style={styles.navIconActive}>🏠</ThemedText>
          <ThemedText style={styles.navTextActive}>Home</ThemedText>
          <View style={styles.navActiveDot} />
        </TouchableOpacity>

        {isAdmin ? (
          <>
            <TouchableOpacity style={styles.navItem} onPress={handleOpenAdd}>
              <ThemedText style={styles.navIcon}>➕</ThemedText>
              <ThemedText style={styles.navText}>Add</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={handleOpenOrders}>
              <ThemedText style={styles.navIcon}>🧾</ThemedText>
              <ThemedText style={styles.navText}>Order</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            

            <TouchableOpacity style={styles.navItem} onPress={() => setCartModalVisible(true)}>
              <View style={styles.navIconWrap}>
                <ThemedText style={styles.navIcon}>🛒</ThemedText>
                {cartCount > 0 && (
                  <View style={styles.navCartBadge}>
                    <ThemedText style={styles.navCartBadgeText}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={styles.navText}>Cart</ThemedText>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.navItem}>
          <ThemedText style={styles.navIcon}>⚙️</ThemedText>
          <ThemedText style={styles.navText}>Settings</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Modal เพิ่ม/แก้ไข จักรยาน */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ThemedText style={styles.modalTitle}>
              {editingProduct ? '✏️ Edit Bicycle' : '＋ Add New Bicycle'}
            </ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Bike Name (ชื่อรุ่นจักรยาน)"
              value={bikeName}
              onChangeText={setBikeName}
            />
            <TextInput
              style={styles.input}
              placeholder="Brand (ยี่ห้อ)"
              value={brand}
              onChangeText={setBrand}
            />
            <TextInput
              style={styles.input}
              placeholder="Category (ประเภทจักรยาน)"
              value={category}
              onChangeText={setCategory}
            />
            <TextInput
              style={styles.input}
              placeholder="Price (ราคา)"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
            <TextInput
              style={styles.input}
              placeholder="Stock Quantity (จำนวนคงเหลือ)"
              keyboardType="numeric"
              value={stockQty}
              onChangeText={setStockQty}
            />
            <ThemedText style={styles.imageSectionLabel}>
              รูปภาพ (พิมพ์ลิงก์ หรือเลือกจากเครื่องอย่างใดอย่างหนึ่ง)
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Image URL (ลิงก์รูปภาพ)"
              value={image}
              onChangeText={setImage}
              editable={!isUploadingImage}
            />

            <TouchableOpacity
              style={styles.pickImageBtn}
              onPress={pickImageFromDevice}
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <ThemedText style={styles.pickImageBtnIcon}>🖼️</ThemedText>
                  <ThemedText style={styles.pickImageBtnText}>เลือกรูปจากเครื่อง</ThemedText>
                </>
              )}
            </TouchableOpacity>

            {!!image && (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: image }} style={styles.imagePreview} resizeMode="cover" />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, isUploadingImage && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isUploadingImage}
              >
                <ThemedText style={styles.saveBtnText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal ตัวกรอง */}
      <Modal visible={filterModalVisible} animationType="slide" transparent>
        <View style={styles.filterOverlay}>
          <View style={styles.filterSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeaderRow}>
              <ThemedText style={styles.sheetTitle}>Filter</ThemedText>
              <TouchableOpacity
                style={styles.sheetCloseButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <ThemedText style={styles.sheetCloseIcon}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.filterLabel}>CATEGORY</ThemedText>
            <View style={styles.categoryChipsRow}>
              <TouchableOpacity
                style={[styles.categoryChip, draftCategory === '' && styles.categoryChipActive]}
                onPress={() => setDraftCategory('')}
              >
                <ThemedText
                  style={[styles.categoryChipText, draftCategory === '' && styles.categoryChipTextActive]}
                >
                  ทั้งหมด
                </ThemedText>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, draftCategory === cat && styles.categoryChipActive]}
                  onPress={() => setDraftCategory(cat)}
                >
                  <ThemedText
                    style={[styles.categoryChipText, draftCategory === cat && styles.categoryChipTextActive]}
                  >
                    {cat}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.filterLabel}>PRICE RANGE</ThemedText>
            <View style={styles.priceRow}>
              <View style={[styles.priceInputWrap, styles.priceInput]}>
                <ThemedText style={styles.priceLabel}>ต่ำสุด</ThemedText>
                <View style={styles.priceInputField}>
                  <ThemedText style={styles.priceCurrency}>฿</ThemedText>
                  <TextInput
                    style={styles.priceTextInput}
                    placeholder="0"
                    placeholderTextColor="#94A0AE"
                    keyboardType="numeric"
                    value={draftMinPrice}
                    onChangeText={setDraftMinPrice}
                  />
                </View>
              </View>
              <View style={[styles.priceInputWrap, styles.priceInput]}>
                <ThemedText style={styles.priceLabel}>สูงสุด</ThemedText>
                <View style={styles.priceInputField}>
                  <ThemedText style={styles.priceCurrency}>฿</ThemedText>
                  <TextInput
                    style={styles.priceTextInput}
                    placeholder="500"
                    placeholderTextColor="#94A0AE"
                    keyboardType="numeric"
                    value={draftMaxPrice}
                    onChangeText={setDraftMaxPrice}
                  />
                </View>
              </View>
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.clearFilterBtn} onPress={resetFilters}>
                <ThemedText style={styles.clearFilterBtnText}>ล้างตัวกรอง</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyFilterBtn} onPress={applyFilters}>
                <ThemedText style={styles.applyFilterBtnText}>ใช้ตัวกรอง</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal รถเข็นสินค้า (Cart) */}
      <Modal visible={cartModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartModalContainer}>
            <View style={styles.cartHeaderRow}>
              <ThemedText style={styles.cartTitle}>🛒 รถเข็นของคุณ</ThemedText>
              <TouchableOpacity onPress={() => setCartModalVisible(false)}>
                <ThemedText style={styles.sheetCloseIcon}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {cartItems.length === 0 ? (
              <View style={styles.emptyCartWrap}>
                <ThemedText style={styles.emptyIcon}>🛍️</ThemedText>
                <ThemedText style={styles.emptyText}>ไม่มีสินค้าในรถเข็น</ThemedText>
              </View>
            ) : (
              <>
                <ScrollView style={styles.cartList}>
                  {cartItems.map(({ product, qty }) => (
                    <View key={product.id} style={styles.cartItemRow}>
                      <Image source={{ uri: product.image }} style={styles.cartItemImg} />
                      <View style={styles.cartItemInfo}>
                        <ThemedText style={styles.cartItemName} numberOfLines={1}>
                          {product.bike_name}
                        </ThemedText>
                        <ThemedText style={styles.cartItemPrice}>
                          ฿{product.price.toLocaleString()}
                        </ThemedText>
                      </View>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateCartQty(product.id, -1)}
                        >
                          <ThemedText style={styles.qtyBtnText}>-</ThemedText>
                        </TouchableOpacity>
                        <ThemedText style={styles.qtyText}>{qty}</ThemedText>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateCartQty(product.id, 1)}
                        >
                          <ThemedText style={styles.qtyBtnText}>+</ThemedText>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.cartDeleteBtn}
                        onPress={() => removeFromCart(product.id)}
                      >
                        <ThemedText style={styles.cartDeleteIcon}>🗑️</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.cartFooter}>
                  <View style={styles.cartTotalRow}>
                    <ThemedText style={styles.cartTotalLabel}>รวมทั้งหมด:</ThemedText>
                    <ThemedText style={styles.cartTotalVal}>฿{cartTotal.toLocaleString()}</ThemedText>
                  </View>
                  <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                    <ThemedText style={styles.checkoutBtnText}>ชำระเงิน</ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal สแกน QR Code + แนบสลิปการโอนเงิน */}
      <Modal visible={qrModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={styles.qrModalContainer}>
              <ThemedText style={styles.qrModalTitle}>สแกนเพื่อชำระเงิน</ThemedText>

              <ThemedText style={styles.qrTotalLabel}>ยอดชำระทั้งหมด</ThemedText>
              <ThemedText style={styles.qrTotalValue}>฿{cartTotal.toLocaleString()}</ThemedText>

              <View style={styles.qrImageWrap}>
                <QRCodeSVG
                  value={generatePayload(MERCHANT_PROMPTPAY_NO, { amount: cartTotal })}
                  size={180}
                />
              </View>
              <ThemedText style={styles.qrTotalLabel}>ที่อยู่จัดส่ง</ThemedText>
                <TextInput
                  style={[styles.input, { width: '100%', height: 70, textAlignVertical: 'top' }]}
                  placeholder="กรอกที่อยู่จัดส่ง (บ้านเลขที่, ถนน, เขต/อำเภอ, จังหวัด)..."
                  placeholderTextColor="#94A0AE"
                  multiline
                  numberOfLines={3}
                  value={shippingAddress}
                  onChangeText={setShippingAddress}
                />
              <ThemedText style={styles.qrSubtext}>
                กรุณาสแกนและแนบสลิปเพื่อยืนยัน
              </ThemedText>

              <TouchableOpacity
                style={styles.uploadSlipBtn}
                onPress={pickSlipImage}
                disabled={isUploadingSlip}
              >
                {isUploadingSlip ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <ThemedText style={styles.uploadSlipIcon}></ThemedText>
                    <ThemedText style={styles.uploadSlipText}>
                      {slipImage ? 'เปลี่ยนรูปสลิป' : 'แนบหลักฐานการโอนเงิน'}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>

              {!!slipImage && (
                <View style={styles.slipPreviewContainer}>
                  <Image source={{ uri: slipImage }} style={styles.slipPreviewImg} resizeMode="contain" />
                </View>
              )}

              <View style={styles.qrActionRow}>
                <TouchableOpacity
                  style={styles.qrCancelBtn}
                  onPress={() => setQrModalVisible(false)}
                >
                  <ThemedText style={styles.qrCancelBtnText}>ยกเลิก</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.qrDoneBtn, (!slipImage || isUploadingSlip) && styles.qrDoneBtnDisabled]}
                  onPress={handleFinishPayment}
                  disabled={!slipImage || isUploadingSlip}
                >
                  <ThemedText style={styles.qrDoneBtnText}>ยืนยัน</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal จัดการคำสั่งซื้อ (Orders) สำหรับ Admin */}
      <Modal visible={ordersModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.ordersModalContainer}>
            <View style={styles.cartHeaderRow}>
              <ThemedText style={styles.cartTitle}>🧾 คำสั่งซื้อของลูกค้า</ThemedText>
              <TouchableOpacity onPress={() => setOrdersModalVisible(false)}>
                <ThemedText style={styles.sheetCloseIcon}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {/* แท็บกรองตามสถานะ */}
            <View style={styles.orderTabsRow}>
              {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.orderTab, orderStatusFilter === tab && styles.orderTabActive]}
                  onPress={() => handleFilterOrders(tab)}
                >
                  <ThemedText
                    style={[styles.orderTabText, orderStatusFilter === tab && styles.orderTabTextActive]}
                  >
                    {tab === 'pending' && 'รอตรวจสอบ'}
                    {tab === 'approved' && 'อนุมัติแล้ว'}
                    {tab === 'rejected' && 'ปฏิเสธแล้ว'}
                    {tab === 'all' && 'ทั้งหมด'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {ordersLoading ? (
              <View style={styles.emptyCartWrap}>
                <ActivityIndicator size="large" color={colors.secondary} />
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.emptyCartWrap}>
                <ThemedText style={styles.emptyIcon}>📭</ThemedText>
                <ThemedText style={styles.emptyText}>ไม่มีคำสั่งซื้อในหมวดนี้</ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.orderList}>
                {orders.map((order) => {
                  const statusInfo = orderStatusLabel(order.status);
                  const isUpdating = updatingOrderId === order.id;
                  return (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={styles.orderCardHeader}>
                        <ThemedText style={styles.orderIdText}>คำสั่งซื้อ #{order.id}</ThemedText>
                        <View style={[styles.orderStatusBadge, statusInfo.style]}>
                          <ThemedText style={styles.orderStatusBadgeText}>{statusInfo.text}</ThemedText>
                        </View>
                      </View>

                      <ThemedText style={styles.orderCustomerText}>
                        👤 {order.user_name || `User #${order.user_id}`}
                      </ThemedText>
                      {!!order.email && (
                        <ThemedText style={styles.orderMetaText}>✉️ {order.email}</ThemedText>
                      )}
                      <ThemedText style={styles.orderMetaText}>
                        🕒 {new Date(order.created_at).toLocaleString('th-TH')}
                      </ThemedText>
                      <ThemedText style={styles.orderAmountText}>
                        ฿{Number(order.total_amount).toLocaleString()}
                      </ThemedText>

                      <TouchableOpacity
                        style={styles.orderAddressToggle}
                        onPress={() => toggleOrderAddress(order.id)}
                      >
                        <ThemedText style={styles.orderAddressToggleText}>ที่อยู่จัดส่ง</ThemedText>
                        <ThemedText style={styles.orderAddressToggleIcon}>
                          {expandedOrderIds.has(order.id) ? '▲' : '▼'}
                        </ThemedText>
                      </TouchableOpacity>
                      {expandedOrderIds.has(order.id) && (
                        <View style={styles.orderAddressBox}>
                          <ThemedText style={styles.orderAddressText}>
                            {order.shipping_address?.trim() ? order.shipping_address : 'ไม่มีข้อมูลที่อยู่จัดส่ง'}
                          </ThemedText>
                        </View>
                      )}

                      {!!order.slip_url && (
                        <TouchableOpacity onPress={() => setPreviewSlipUrl(order.slip_url)}>
                          <Image
                            source={{ uri: order.slip_url }}
                            style={styles.orderSlipImg}
                            resizeMode="cover"
                          />
                          <ThemedText style={styles.orderSlipHint}>แตะเพื่อดูสลิปเต็ม</ThemedText>
                        </TouchableOpacity>
                      )}

                      {order.status === 'pending' && (
                        <View style={styles.orderActionRow}>
                          <TouchableOpacity
                            style={[styles.orderRejectBtn, isUpdating && styles.orderBtnDisabled]}
                            onPress={() => handleRejectOrder(order.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <ActivityIndicator size="small" color={colors.onErrorContainer} />
                            ) : (
                              <ThemedText style={styles.orderRejectBtnText}>✕ Reject</ThemedText>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.orderApproveBtn, isUpdating && styles.orderBtnDisabled]}
                            onPress={() => handleApproveOrder(order.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <ThemedText style={styles.orderApproveBtnText}>✓ Approve</ThemedText>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal พรีวิวสลิปแบบเต็มจอ */}
      <Modal visible={!!previewSlipUrl} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.slipPreviewOverlay}
          activeOpacity={1}
          onPress={() => setPreviewSlipUrl('')}
        >
          {!!previewSlipUrl && (
            <Image
              source={{ uri: previewSlipUrl }}
              style={styles.slipPreviewFull}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity style={styles.slipPreviewCloseBtn} onPress={() => setPreviewSlipUrl('')}>
            <ThemedText style={styles.slipPreviewCloseText}>✕ ปิด</ThemedText>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.outlineVariant,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 22,
  },
  titleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: headlineSerif,
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    maxWidth: 120,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeAdmin: {
    backgroundColor: colors.primaryContainer,
  },
  roleBadgeUser: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSurface,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonAdmin: {
    borderColor: colors.primary,
  },
  profileButtonUser: {
    borderColor: colors.secondary,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
  },
  profileCrown: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  profileCrownIcon: {
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.surface,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 18,
    color: colors.onSurface,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  addRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  addButtonIcon: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  addButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  shelfArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  collectionsHeading: {
    fontFamily: headlineSerif,
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 10,
  },
  bannerCard: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.primaryContainer,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 31, 77, 0.45)',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  bannerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
    letterSpacing: 1,
  },
  bannerTitle: {
    fontFamily: headlineSerif,
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: colors.surfaceContainerLow,
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 12,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.outline,
  },
  bannerDotActive: {
    width: 16,
    backgroundColor: colors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionLabel: {
    fontFamily: headlineSerif,
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  sectionCount: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderTopColor: colors.outlineVariant,
  },
  navItem: {
    alignItems: 'center',
  },
  navItemActive: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
  },
  navIconActive: {
    fontSize: 20,
  },
  navText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  navTextActive: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  navIconWrap: {
    position: 'relative',
  },
  navCartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCartBadgeText: {
    color: colors.onPrimary,
    fontSize: 9,
    fontWeight: '700',
  },

  // ---- Modal Base & Form Styles ----
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 23, 28, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
  },
  modalTitle: {
    fontFamily: headlineSerif,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: colors.onSurface,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 10,
  },
  imageSectionLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 10,
  },
  pickImageBtnIcon: {
    fontSize: 16,
  },
  pickImageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
  },
  imagePreviewWrap: {
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // ---- Filter Sheet Styles ----
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 23, 28, 0.5)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 2,
    borderColor: colors.outlineVariant,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outline,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: headlineSerif,
    fontSize: 18,
    fontWeight: '700',
  },
  sheetCloseButton: {
    padding: 4,
  },
  sheetCloseIcon: {
    fontSize: 18,
    color: colors.onSurfaceVariant,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.onSurface,
  },
  categoryChipTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  priceInputWrap: {
    flex: 1,
  },
  priceInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  priceLabel: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  priceInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  priceCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    marginRight: 4,
  },
  priceTextInput: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
    padding: 0,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
  },
  clearFilterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
  },
  clearFilterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  applyFilterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyFilterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },

  // ---- Cart Modal Styles ----
  cartModalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTitle: {
    fontFamily: headlineSerif,
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
  },
  emptyCartWrap: {
    padding: 40,
    alignItems: 'center',
  },
  cartList: {
    maxHeight: 300,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  cartItemImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  cartItemPrice: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  cartDeleteBtn: {
    padding: 6,
  },
  cartDeleteIcon: {
    fontSize: 16,
  },
  cartFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cartTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  cartTotalVal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },

  // ---- QR Code & Slip Modal Styles ----
  qrModalContainer: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    marginVertical: 20,
  },
  qrModalTitle: {
    fontFamily: headlineSerif,
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 6,
  },
  qrTotalLabel: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  qrTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  qrImageWrap: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 10,
  },
  qrSubtext: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 16,
  },
  uploadSlipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 8,
    marginBottom: 10,
  },
  uploadSlipIcon: {
    fontSize: 16,
  },
  uploadSlipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
  },
  slipPreviewContainer: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: 14,
  },
  slipPreviewImg: {
    width: '100%',
    height: '100%',
  },
  qrActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  qrCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCancelBtnText: {
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  qrDoneBtn: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrDoneBtnDisabled: {
    backgroundColor: colors.outline,
    opacity: 0.6,
  },
  qrDoneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ---- Orders (Admin) Modal Styles ----
  ordersModalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
  },
  orderTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  orderTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  orderTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  orderTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  orderTabTextActive: {
    color: colors.onPrimary,
  },
  orderList: {
    maxHeight: 480,
  },
  orderCard: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.surfaceContainerLow,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderStatusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderStatusPending: {
    backgroundColor: colors.tertiaryFixed,
  },
  orderStatusApproved: {
    backgroundColor: '#D6F5DD',
  },
  orderStatusRejected: {
    backgroundColor: colors.errorContainer,
  },
  orderCustomerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 2,
  },
  orderMetaText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  orderAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
    marginBottom: 8,
  },
  orderAddressToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHigh,
    marginBottom: 8,
  },
  orderAddressToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
  },
  orderAddressToggleIcon: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  orderAddressBox: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: colors.surfaceContainerLowest,
  },
  orderAddressText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 17,
  },
  orderSlipImg: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  orderSlipHint: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  orderActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  orderApproveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1FA34D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderApproveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  orderRejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderRejectBtnText: {
    color: colors.onErrorContainer,
    fontWeight: '700',
    fontSize: 13,
  },
  orderBtnDisabled: {
    opacity: 0.6,
  },
  slipPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slipPreviewFull: {
    width: '92%',
    height: '75%',
  },
  slipPreviewCloseBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  slipPreviewCloseText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});