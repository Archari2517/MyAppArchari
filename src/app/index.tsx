import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ProductCard, type Product } from '@/components/product-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_BASE_URL, useAuth } from '@/context/auth-context';
import { useEffect, useRef, useState } from 'react';

const PRODUCTS_URL = `${API_BASE_URL}/Inventory`;
const CATEGORIES_URL = `${PRODUCTS_URL}/categories`;

export default function HomeScreen() {
  const { user, isAdmin, isLoading: authLoading, logout } = useAuth();

  // ถ้ายังไม่ได้ login ให้เด้งไปหน้า login (รอจนกว่าจะเช็ค session เสร็จก่อน)
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user]);

  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // เก็บสถานะกรณีโหลดรูปโปรไฟล์จาก database ไม่สำเร็จ (เช่น ลิงก์เสีย) เพื่อสลับไปใช้ avatar สำรอง
  const [avatarError, setAvatarError] = useState(false);
  useEffect(() => {
    setAvatarError(false);
  }, [user?.user_img]);

  // State สำหรับค้นหา / กรอง (ทำงานที่ backend)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  // ค่าชั่วคราวขณะแก้ในหน้าต่างตัวกรอง (ยังไม่ apply จนกว่าจะกด "ใช้ตัวกรอง")
  const [draftCategory, setDraftCategory] = useState('');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');

  // State สำหรับฟอร์ม
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // ฟังก์ชันดึงข้อมูล (ส่ง search/category/price ไปกรองที่ backend)
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

  // ดีเลย์การค้นหา 400ms หลังหยุดพิมพ์ ก่อนยิง API (กันยิงถี่เกินไป)
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

  // เปิดหน้าต่างตัวกรอง (โหลดค่าปัจจุบันมาเป็นค่าตั้งต้นในฟอร์ม)
  const openFilterModal = () => {
    setDraftCategory(selectedCategory);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setFilterModalVisible(true);
  };

  // กดใช้ตัวกรอง
  const applyFilters = () => {
    setSelectedCategory(draftCategory);
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setFilterModalVisible(false);
    loadProducts({ category: draftCategory, minPrice: draftMinPrice, maxPrice: draftMaxPrice });
  };

  // ล้างตัวกรองทั้งหมด
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

  // ล้างค่าในฟอร์ม
  const resetForm = () => {
    setBookTitle('');
    setAuthor('');
    setPrice('');
    setStockQty('');
    setCategory('');
    setCoverImage('');
    setEditingProduct(null);
  };

  // เปิด Modal สำหรับเพิ่มหนังสือใหม่
  const handleOpenAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  // เปิด Modal สำหรับแก้ไขหนังสือ
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setBookTitle(product.book_title);
    setAuthor(product.author);
    setPrice(product.price.toString());
    setStockQty(product.stock_qty.toString());
    setCategory(product.category);
    setCoverImage(product.cover_image);
    setModalVisible(true);
  };

  // แจ้งเตือนข้อความ (รองรับทั้ง Web และ App มือถือ)
  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // บันทึกข้อมูล (POST เมื่อเพิ่ม / PUT เมื่อแก้ไข)
  const handleSave = async () => {
    if (!bookTitle) {
      showAlert('แจ้งเตือน', 'กรุณากรอกชื่อหนังสือ');
      return;
    }

    const payload = {
      book_title: bookTitle,
      author,
      price: parseFloat(price) || 0,
      stock_qty: parseInt(stockQty) || 0,
      category,
      cover_image: coverImage || 'https://picsum.photos/200/260',
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

  // ฟังก์ชันลบข้อมูล (แก้ไขให้รองรับ Web และ Mobile)
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

  const handleDelete = (id: number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('คุณต้องการลบหนังสือเล่มนี้ใช่หรือไม่?');
      if (confirmed) {
        executeDelete(id);
      }
    } else {
      Alert.alert('ยืนยันการลบ', 'คุณต้องการลบหนังสือเล่มนี้ใช่หรือไม่?', [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบข้อมูล',
          style: 'destructive',
          onPress: () => executeDelete(id),
        },
      ]);
    }
  };

  // ระหว่างเช็ค session หรือกำลังจะเด้งไปหน้า login ให้แสดง loading เฉยๆ
  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF3EA" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B4693E" />
        </View>
      </SafeAreaView>
    );
  }

  

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF3EA" />

      {/* Top Navigation */}
      <ThemedView style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <ThemedText style={styles.logoIcon}>📖</ThemedText>
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

        {/* รูปโปรไฟล์: ดึงจาก database (user.user_img) เสมอ ไม่ว่าจะเป็น user หรือ admin
            ถ้าไม่มีรูป หรือรูปโหลดไม่สำเร็จ จะ fallback ไปใช้ avatar อัตโนมัติจากตัวอักษรแรกของชื่อ */}
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
            placeholder="Search by title or category..."
            placeholderTextColor="#B5A395"
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

      {/* ปุ่มกดเพิ่มสินค้า (เฉพาะ Admin เท่านั้น) */}
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
          <ThemedText style={styles.sectionLabel}>
            {searchQuery || activeFilterCount > 0
              ? `Search Results (${products.length})`
              : `All Products (${products.length})`}
          </ThemedText>
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
          />
        )}
      />

      {/* Bottom Navigation */}
      <ThemedView style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <ThemedText style={styles.navIcon}>🏠</ThemedText>
          <ThemedText style={styles.navText}>Home</ThemedText>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity style={styles.navItem} onPress={handleOpenAdd}>
            <ThemedText style={styles.navIcon}>➕</ThemedText>
            <ThemedText style={styles.navText}>Add</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.navItemActive}>
          <ThemedText style={styles.navIconActive}>🗂️</ThemedText>
          <ThemedText style={styles.navTextActive}>Product</ThemedText>
          <View style={styles.navActiveDot} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <ThemedText style={styles.navIcon}>⚙️</ThemedText>
          <ThemedText style={styles.navText}>Settings</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Modal ป๊อปอัปสำหรับ เพิ่ม/แก้ไข หนังสือ */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ThemedText style={styles.modalTitle}>
              {editingProduct ? '✏️ Edit Book' : '＋ Add New Book'}
            </ThemedText>

            <TextInput
              style={styles.input}
              placeholder="Book Title (ชื่อหนังสือ)"
              value={bookTitle}
              onChangeText={setBookTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Author (ผู้แต่ง)"
              value={author}
              onChangeText={setAuthor}
            />
            <TextInput
              style={styles.input}
              placeholder="Category (หมวดหมู่)"
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
              placeholder="Stock Quantity (จำนวนสต็อก)"
              keyboardType="numeric"
              value={stockQty}
              onChangeText={setStockQty}
            />
            <TextInput
              style={styles.input}
              placeholder="Cover Image URL (ลิงก์รูปปก)"
              value={coverImage}
              onChangeText={setCoverImage}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <ThemedText style={styles.saveBtnText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal ตัวกรอง: category + ช่วงราคา */}
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
                    placeholderTextColor="#B5A395"
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
                    placeholderTextColor="#B5A395"
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF3EA',
  },
  header: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FAF3EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    width: 42,
    height: 42,
    backgroundColor: '#F6E5D3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoIcon: {
    fontSize: 20,
  },
  titleWrap: {
    justifyContent: 'center',
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3D2B1F',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9C8776',
    maxWidth: 110,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeAdmin: {
    backgroundColor: '#F3D9B1',
  },
  roleBadgeUser: {
    backgroundColor: '#E8DCCB',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B4A34',
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'visible',
    backgroundColor: '#F6E5D3',
    borderWidth: 2,
  },
  profileButtonUser: {
    borderColor: '#B4693E',
  },
  profileButtonAdmin: {
    borderColor: '#D9A441',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  profileFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
    backgroundColor: '#B4693E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileFallbackText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  profileCrown: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9A441',
  },
  profileCrownIcon: {
    fontSize: 9,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 10,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE1D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    height: 48,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 6,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#4A3628',
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFE2D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  clearIcon: {
    fontSize: 11,
    color: '#8C6A52',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9C8776',
    textAlign: 'center',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#B4693E',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterIcon: {
    color: '#B4693E',
    fontSize: 17,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#B4693E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B5A395',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 10,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  categoryChip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCCB',
  },
  categoryChipActive: {
    backgroundColor: '#B4693E',
    borderColor: '#B4693E',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#6B4A34',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputWrap: {
    flex: 1,
  },
  priceInput: {
    marginBottom: 0,
  },
  priceLabel: {
    fontSize: 12,
    color: '#9C8776',
    marginBottom: 6,
  },
  priceInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCCB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  priceCurrency: {
    fontSize: 14,
    color: '#B4693E',
    fontWeight: '700',
    marginRight: 6,
  },
  priceTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#3D2B1F',
  },
  addRow: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  addButton: {
    backgroundColor: '#B4693E',
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#6B4A34',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  addButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  shelfArea: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8C6A52',
    marginBottom: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DCCB',
    paddingVertical: 10,
    paddingBottom: 14,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.5,
  },
  navIconActive: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 11,
    color: '#9C8776',
  },
  navTextActive: {
    fontSize: 11,
    color: '#B4693E',
    fontWeight: '700',
  },
  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#B4693E',
    marginTop: 4,
  },
  
  // Style ของ Modal Pop-up
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A3628',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#FAF3EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    color: '#4A3628',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#8C6A52',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#B4693E',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Style ของ Filter Bottom Sheet
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: '#FAF3EA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0D3C0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3D2B1F',
  },
  sheetCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCloseIcon: {
    fontSize: 13,
    color: '#6B4A34',
    fontWeight: '700',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  clearFilterBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCCB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFilterBtnText: {
    color: '#6B4A34',
    fontWeight: '600',
    fontSize: 14,
  },
  applyFilterBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#B4693E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyFilterBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});