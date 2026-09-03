import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Product {
  id: number;
  bike_name: string;
  brand: string;
  price: number;
  stock_qty: number;
  category: string;
  image: string;
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isWishlisted?: boolean;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}: ProductCardProps) {
  // ถ้ามี onEdit หรือ onDelete แปลว่ากำลังแสดงในมุมมอง Admin
  const isAdminView = Boolean(onEdit || onDelete);

  return (
    <View style={styles.card}>
      {/* ปุ่มหัวใจ (Wishlist) มุมขวาบน — โชว์เฉพาะมุมมอง User เท่านั้น ไม่โชว์ในหน้า Admin */}
      {!isAdminView && (
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => onToggleWishlist?.(product)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          
        </TouchableOpacity>
      )}

      <View style={styles.topRow}>
        {/* รูปภาพจักรยาน */}
        <Image
          source={{ uri: product.image }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* ข้อความและรายละเอียด */}
        <View style={styles.infoContainer}>
          <Text style={styles.author} numberOfLines={1}>
            {product.brand}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {product.bike_name}
          </Text>

          <View style={styles.stockRow}>
            <View style={styles.stockDot} />
            <Text style={styles.stock}>
              {product.stock_qty > 0 ? `In stock: ${product.stock_qty}` : 'Out of stock'}
            </Text>
          </View>

          <View style={styles.pillRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.category} numberOfLines={1}>
                {product.category}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* แถวล่าง: ราคา + ปุ่มกระทำ */}
      <View style={styles.bottomRow}>
        <View style={styles.priceBox}>
          <Text style={styles.currency}>฿</Text>
          <Text style={styles.price}>{product.price}</Text>
        </View>

        {isAdminView ? (
          <View style={styles.adminActions}>
            {onEdit && (
              <TouchableOpacity
                style={[styles.squareBtn, styles.editSquareBtn]}
                onPress={() => onEdit(product)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.squareBtnIcon}>✏️</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[styles.squareBtn, styles.deleteSquareBtn]}
                onPress={() => onDelete(product.id)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.squareBtnIcon}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.squareBtn, styles.cartSquareBtn]}
            onPress={() => onAddToCart?.(product)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.squareBtnIcon}>🛒</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistIcon: {
    fontSize: 18,
    color: '#94A0AE',
  },
  wishlistIconActive: {
    color: '#FF6A13',
  },
  topRow: {
    flexDirection: 'row',
  },
  coverImage: {
    width: 84,
    height: 118,
    borderRadius: 12,
    backgroundColor: '#F2F6FB',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
    paddingRight: 22,
    justifyContent: 'center',
  },
  author: {
    fontSize: 13,
    color: '#5B6472',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#14171C',
    marginBottom: 8,
    lineHeight: 21,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  stock: {
    fontSize: 12,
    color: '#3A4250',
    fontWeight: '600',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFE3C8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: '#FFC58A',
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6A13',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderWidth: 2,
    borderColor: '#14171C',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  currency: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14171C',
    marginRight: 3,
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: '#14171C',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 10,
  },
  squareBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartSquareBtn: {
    backgroundColor: '#FFD9A8',
  },
  editSquareBtn: {
    backgroundColor: '#DCE6FF',
  },
  deleteSquareBtn: {
    backgroundColor: '#FFD9D9',
  },
  squareBtnIcon: {
    fontSize: 17,
  },
});