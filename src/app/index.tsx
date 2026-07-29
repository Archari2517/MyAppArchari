import { Alert, FlatList, Modal, Platform, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCard, type Product } from '@/components/product-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect, useState } from 'react';

const PRODUCTS_URL = 'http://119.59.102.161:3068/api/Inventory';

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // State สำหรับฟอร์ม
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [price, setPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // ฟังก์ชันดึงข้อมูล
  const loadProducts = async () => {
    try {
      const response = await fetch(PRODUCTS_URL, {
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

  useEffect(() => {
    loadProducts();
  }, []);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF3EA" />

      {/* Top Navigation */}
      <ThemedView style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <ThemedText style={styles.menuIcon}>☰</ThemedText>
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <ThemedText style={styles.headerEyebrow}>MY STORE</ThemedText>
          <ThemedText style={styles.headerTitle}>Product Catalog</ThemedText>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <ThemedText style={styles.profileIcon}>👤</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, categories..."
            placeholderTextColor="#B5A395"
            editable={true}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <ThemedText style={styles.filterIcon}>⚲</ThemedText>
        </TouchableOpacity>
      </View>

      {/* ปุ่มกดเพิ่มสินค้า */}
      <View style={styles.addRow}>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd}>
          <ThemedText style={styles.addButtonIcon}>＋</ThemedText>
          <ThemedText style={styles.addButtonText}>Add Product</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.shelfArea}
        data={products}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <ThemedText style={styles.sectionLabel}>All Products ({products.length})</ThemedText>
        }
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            onEdit={handleOpenEdit} 
            onDelete={handleDelete} 
          />
        )}
      />

      {/* Bottom Navigation */}
      <ThemedView style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <ThemedText style={styles.navIcon}>🏠</ThemedText>
          <ThemedText style={styles.navText}>Home</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={handleOpenAdd}>
          <ThemedText style={styles.navIcon}>➕</ThemedText>
          <ThemedText style={styles.navText}>Add</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemActive}>
          <View style={styles.navActivePill}>
            <ThemedText style={styles.navIconActive}>🗂️</ThemedText>
          </View>
          <ThemedText style={styles.navTextActive}>Category</ThemedText>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3EA',
  },
  header: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DCCB',
  },
  menuButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    color: '#6B4A34',
  },
  titleWrap: {
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 11,
    color: '#B4693E',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A3628',
  },
  profileButton: {
    width: 34,
    height: 34,
    backgroundColor: '#6B4A34',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 16,
    color: '#FAF3EA',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCCB',
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 44,
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
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCCB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    color: '#6B4A34',
    fontSize: 16,
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
  navActivePill: {
    backgroundColor: '#F3E4D3',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 4,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
    opacity: 0.55,
  },
  navIconActive: {
    fontSize: 18,
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
});