import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
};

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productCover}>
        <Image
          source={{ uri: product.image }}
          style={styles.productCoverImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.productInfo}>
        <ThemedText style={styles.productTag}>{product.category}</ThemedText>
        <ThemedText style={styles.productTitle}>{product.name}</ThemedText>
        <ThemedText style={styles.productPrice}>${product.price}</ThemedText>
      </View>
      <TouchableOpacity style={styles.productMore}>
        <ThemedText style={styles.productMoreIcon}>⋮</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  productCover: {
    width: 52,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#F3E4D3',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productCoverImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
  },
  productTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B4693E',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A3628',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B4A34',
  },
  productMore: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productMoreIcon: {
    fontSize: 18,
    color: '#B5A395',
  },
});
