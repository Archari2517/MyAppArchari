import { FlatList, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ProductCard, type Product } from '@/components/product-card';

// Replace the "image" URLs below with your own product photos hosted online.
const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'The Little Prince',
    category: 'Fiction',
    price: '185',
    image: 'https://picsum.photos/seed/little-prince/200/260',
  },
  {
    id: '2',
    name: 'Secrets of the Millionaire Mind',
    category: 'Business',
    price: '245',
    image: 'https://picsum.photos/seed/millionaire-mind/200/260',
  },
  {
    id: '3',
    name: 'Totto-chan',
    category: 'Biography',
    price: '220',
    image: 'https://picsum.photos/seed/totto-chan/200/260',
  },
  {
    id: '4',
    name: 'Think and Grow Rich',
    category: 'Self-Help',
    price: '199',
    image: 'https://picsum.photos/seed/think-grow-rich/200/260',
  },
];

export default function HomeScreen() {
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

      <View style={styles.addRow}>
        <TouchableOpacity style={styles.addButton}>
          <ThemedText style={styles.addButtonIcon}>＋</ThemedText>
          <ThemedText style={styles.addButtonText}>Add Product</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.shelfArea}
        data={PRODUCTS}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <ThemedText style={styles.sectionLabel}>All Products ({PRODUCTS.length})</ThemedText>
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />

      {/* Bottom Navigation */}
      <ThemedView style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <ThemedText style={styles.navIcon}>🏠</ThemedText>
          <ThemedText style={styles.navText}>Home</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
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
    </SafeAreaView>
  );
}

// ---- Warm Reading Room palette ----
// Background cream : #FAF3EA
// Card white       : #FFFFFF
// Deep leather     : #6B4A34
// Warm cocoa       : #8C6A52
// Soft tan border  : #E8DCCB
// Accent (spine)   : #B4693E
// Text ink         : #4A3628
// Muted text       : #9C8776

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3EA',
  },
  // Header Styles
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
  // Search & Filter Styles
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
  // Content area
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
  // Bottom Navigation Styles
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
});
