import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function ProductHeader() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF3EA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.headerEyebrow}>ร้านหนังสือ</Text>
          <Text style={styles.headerTitle}>คลังหนังสือ</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง..."
            placeholderTextColor="#B5A395"
            editable={true}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterIcon}>⚲</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addRow}>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonIcon}>＋</Text>
          <Text style={styles.addButtonText}>เพิ่มหนังสือใหม่</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area (For layout buffer) */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.shelfArea}
      >
        {/* คุณสามารถเพิ่มรายการสินค้าตรงนี้ได้ */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>ชั้นหนังสือยังว่างอยู่</Text>
          <Text style={styles.emptySubtitle}>
            เริ่มเพิ่มหนังสือเล่มแรกของคุณได้เลย
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navText}>หน้าแรก</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>➕</Text>
          <Text style={styles.navText}>เพิ่ม</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemActive}>
          <View style={styles.navActivePill}>
            <Text style={styles.navIconActive}>📚</Text>
          </View>
          <Text style={styles.navTextActive}>หนังสือ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🗂️</Text>
          <Text style={styles.navText}>หมวดหมู่</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: "#FAF3EA",
  },
  // Header Styles
  header: {
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8DCCB",
  },
  menuButton: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 18,
    color: "#6B4A34",
  },
  titleWrap: {
    alignItems: "center",
  },
  headerEyebrow: {
    fontSize: 11,
    color: "#B4693E",
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A3628",
  },
  profileButton: {
    width: 34,
    height: 34,
    backgroundColor: "#6B4A34",
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  profileIcon: {
    fontSize: 16,
    color: "#FAF3EA",
  },
  // Search & Filter Styles
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DCCB",
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    height: 44,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 6,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#4A3628",
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8DCCB",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  filterIcon: {
    color: "#6B4A34",
    fontSize: 16,
  },
  addRow: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  addButton: {
    backgroundColor: "#B4693E",
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    shadowColor: "#6B4A34",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  addButtonIcon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  // Content area
  shelfArea: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B4A34",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9C8776",
    textAlign: "center",
  },
  // Bottom Navigation Styles
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8DCCB",
    paddingVertical: 10,
    paddingBottom: 14,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemActive: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navActivePill: {
    backgroundColor: "#F3E4D3",
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
    color: "#9C8776",
  },
  navTextActive: {
    fontSize: 11,
    color: "#B4693E",
    fontWeight: "700",
  },
});