import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface Product {
  id: number;
  book_title: string;
  author: string;
  price: number;
  stock_qty: number;
  category: string;
  cover_image: string;
}

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <View style={styles.card}>
      {/* รูปภาพปกหนังสือ */}
      <Image 
        source={{ uri: product.cover_image }} 
        style={styles.coverImage}
        resizeMode="cover"
      />

      {/* ข้อความและรายละเอียด */}
      <View style={styles.infoContainer}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {product.book_title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          By {product.author}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.price}>฿{product.price}</Text>
          <Text style={styles.stock}>Stock: {product.stock_qty}</Text>
        </View>

        {/* ปุ่มแก้ไข และ ปุ่มลบ */}
        <View style={styles.actionRow}>
          {onEdit && (
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(product)}>
              <Text style={styles.btnText}>✏️ แก้ไข</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(product.id)}>
              <Text style={styles.deleteBtnText}>🗑️ ลบ</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    alignItems: 'center',
  },
  coverImage: {
    width: 65,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#FAF3EA',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
  },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B4693E',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A3628',
    marginVertical: 2,
  },
  author: {
    fontSize: 13,
    color: '#9C8776',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B4A34',
  },
  stock: {
    fontSize: 12,
    color: '#8C6A52',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F3E4D3',
    borderRadius: 6,
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FDE8E8',
    borderRadius: 6,
  },
  btnText: {
    fontSize: 11,
    color: '#6B4A34',
    fontWeight: '600',
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#D9534F',
    fontWeight: '600',
  },
});