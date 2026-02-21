import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface MerchandiseItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string[];
  stock: { [key: string]: number };
  image?: string;
}

interface CartItem {
  merchandise: MerchandiseItem;
  size: string;
  quantity: number;
}

export default function MerchandiseScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MerchandiseItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [showCart, setShowCart] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cartAnimation] = useState(new Animated.Value(1));

  const categories = ['All', 'T-Shirts', 'Hoodies', 'Accessories', 'Supplements'];

  const loadMerchandise = useCallback(async () => {
    try {
      const data = await api.getMerchandise();
      setMerchandise(data);
    } catch (error) {
      console.log('Error loading merchandise:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMerchandise();
  }, [loadMerchandise]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMerchandise();
  };

  const animateCart = () => {
    Animated.sequence([
      Animated.timing(cartAnimation, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(cartAnimation, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const addToCart = () => {
    if (!selectedItem || !selectedSize) {
      Alert.alert('Select Size', 'Please select a size to continue');
      return;
    }

    const stock = selectedItem.stock[selectedSize] || 0;
    if (stock <= 0) {
      Alert.alert('Out of Stock', 'Sorry, this size is currently out of stock');
      return;
    }

    const existingIndex = cart.findIndex(
      (item) => item.merchandise.id === selectedItem.id && item.size === selectedSize
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      if (newCart[existingIndex].quantity < stock) {
        newCart[existingIndex].quantity += 1;
        setCart(newCart);
        animateCart();
      } else {
        Alert.alert('Limit Reached', 'Maximum available quantity added');
      }
    } else {
      setCart([...cart, { merchandise: selectedItem, size: selectedSize, quantity: 1 }]);
      animateCart();
    }

    setSelectedItem(null);
    setSelectedSize('');
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    const newQty = item.quantity + delta;
    const stock = item.merchandise.stock[item.size] || 0;

    if (newQty > 0 && newQty <= stock) {
      item.quantity = newQty;
      setCart(newCart);
    } else if (newQty <= 0) {
      removeFromCart(index);
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.merchandise.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleProceed = async () => {
    if (cart.length === 0) return;

    Alert.alert(
      'Confirm Order',
      `Total: ₹${getTotalAmount().toLocaleString()}\n\nYour order will be sent to the gym admin for processing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: async () => {
            setOrdering(true);
            try {
              await api.createMerchandiseOrder(
                cart.map((item) => ({
                  merchandise_id: item.merchandise.id,
                  size: item.size,
                  quantity: item.quantity,
                }))
              );
              Alert.alert(
                '🎉 Order Placed!',
                'Your order has been submitted. You will be notified when it\'s ready for pickup at the gym.',
                [{ text: 'Awesome!' }]
              );
              setCart([]);
              setShowCart(false);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to place order');
            } finally {
              setOrdering(false);
            }
          },
        },
      ]
    );
  };

  const filteredMerchandise = selectedCategory === 'All' 
    ? merchandise 
    : merchandise.filter(item => item.category.toLowerCase() === selectedCategory.toLowerCase());

  const renderHeader = () => (
    <View>
      {/* Hero Banner */}
      <LinearGradient
        colors={isDark ? ['#E63946', '#831018'] : ['#E63946', '#B91C1C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBanner}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>HERCULES</Text>
          <Text style={styles.heroSubtitle}>GYM STORE</Text>
          <Text style={styles.heroTagline}>Power Your Journey</Text>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons name="fitness" size={80} color="rgba(255,255,255,0.2)" />
        </View>
      </LinearGradient>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === category ? theme.primary : theme.card,
                borderColor: selectedCategory === category ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                { color: selectedCategory === category ? '#FFF' : theme.text },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {selectedCategory === 'All' ? 'All Products' : selectedCategory}
        </Text>
        <Text style={[styles.productCount, { color: theme.textSecondary }]}>
          {filteredMerchandise.length} items
        </Text>
      </View>
    </View>
  );

  const renderMerchandiseItem = ({ item, index }: { item: MerchandiseItem; index: number }) => {
    const totalStock = Object.values(item.stock).reduce((a, b) => a + b, 0);
    const isLowStock = totalStock > 0 && totalStock <= 5;
    const isOutOfStock = totalStock === 0;

    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          { backgroundColor: theme.card },
          index % 2 === 0 ? { marginRight: 8 } : { marginLeft: 8 },
        ]}
        onPress={() => {
          setSelectedItem(item);
          setSelectedSize('');
        }}
        activeOpacity={0.9}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={isDark ? ['#2A2A2A', '#1A1A1A'] : ['#F5F5F5', '#E0E0E0']}
              style={styles.placeholderImage}
            >
              <Ionicons name="shirt" size={50} color={theme.textSecondary} />
            </LinearGradient>
          )}
          
          {/* Stock Badge */}
          {isOutOfStock && (
            <View style={[styles.stockBadge, { backgroundColor: theme.error }]}>
              <Text style={styles.stockBadgeText}>OUT OF STOCK</Text>
            </View>
          )}
          {isLowStock && !isOutOfStock && (
            <View style={[styles.stockBadge, { backgroundColor: theme.warning }]}>
              <Text style={styles.stockBadgeText}>ONLY {totalStock} LEFT</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={[styles.productCategory, { color: theme.primary }]}>
            {item.category.toUpperCase()}
          </Text>
          <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: theme.text }]}>
              ₹{item.price.toLocaleString()}
            </Text>
          </View>
          
          {/* Size Dots */}
          <View style={styles.sizeDots}>
            {item.sizes.slice(0, 4).map((size) => (
              <View
                key={size}
                style={[
                  styles.sizeDot,
                  {
                    backgroundColor: (item.stock[size] || 0) > 0 ? theme.success : theme.border,
                  },
                ]}
              />
            ))}
            {item.sizes.length > 4 && (
              <Text style={[styles.moreText, { color: theme.textSecondary }]}>+{item.sizes.length - 4}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading store...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Shop</Text>
        </View>
        <View style={styles.headerActions}>
          {user?.role === 'admin' && (
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.card }]}
              onPress={() => router.push('/merchandise/orders')}
            >
              <Ionicons name="receipt-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.cartIconButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowCart(true)}
          >
            <Animated.View style={{ transform: [{ scale: cartAnimation }] }}>
              <Ionicons name="cart" size={22} color="#FFF" />
            </Animated.View>
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{getTotalItems()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredMerchandise}
        renderItem={renderMerchandiseItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-outline" size={80} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Products Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Check back later for new arrivals
            </Text>
          </View>
        }
      />

      {/* Floating Cart Summary */}
      {cart.length > 0 && !showCart && (
        <TouchableOpacity
          style={[styles.floatingCart, { backgroundColor: theme.primary }]}
          onPress={() => setShowCart(true)}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{getTotalItems()}</Text>
            </View>
            <Text style={styles.floatingCartText}>View Cart</Text>
          </View>
          <Text style={styles.floatingCartPrice}>₹{getTotalAmount().toLocaleString()}</Text>
        </TouchableOpacity>
      )}

      {/* Product Detail Modal */}
      <Modal visible={!!selectedItem} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <TouchableOpacity 
              style={[styles.modalClose, { backgroundColor: theme.card }]} 
              onPress={() => setSelectedItem(null)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>

            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Product Image */}
                {selectedItem.image ? (
                  <Image source={{ uri: selectedItem.image }} style={styles.modalImage} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={isDark ? ['#2A2A2A', '#1A1A1A'] : ['#F5F5F5', '#E0E0E0']}
                    style={styles.modalPlaceholder}
                  >
                    <Ionicons name="shirt" size={100} color={theme.textSecondary} />
                  </LinearGradient>
                )}

                <View style={styles.modalInfo}>
                  {/* Category & Name */}
                  <Text style={[styles.modalCategory, { color: theme.primary }]}>
                    {selectedItem.category.toUpperCase()}
                  </Text>
                  <Text style={[styles.modalName, { color: theme.text }]}>{selectedItem.name}</Text>
                  
                  {/* Price */}
                  <View style={styles.modalPriceRow}>
                    <Text style={[styles.modalPrice, { color: theme.text }]}>
                      ₹{selectedItem.price.toLocaleString()}
                    </Text>
                    <View style={[styles.inclTaxBadge, { backgroundColor: theme.success + '20' }]}>
                      <Text style={[styles.inclTaxText, { color: theme.success }]}>Incl. Tax</Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={[styles.modalDescription, { color: theme.textSecondary }]}>
                    {selectedItem.description}
                  </Text>

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  {/* Size Selection */}
                  <Text style={[styles.selectLabel, { color: theme.text }]}>Select Size</Text>
                  <View style={styles.sizeOptions}>
                    {selectedItem.sizes.map((size) => {
                      const stock = selectedItem.stock[size] || 0;
                      const isAvailable = stock > 0;
                      const isSelected = selectedSize === size;

                      return (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.sizeOption,
                            {
                              backgroundColor: isSelected ? theme.primary : theme.card,
                              borderColor: isSelected ? theme.primary : theme.border,
                              opacity: isAvailable ? 1 : 0.4,
                            },
                          ]}
                          onPress={() => isAvailable && setSelectedSize(size)}
                          disabled={!isAvailable}
                        >
                          <Text style={[styles.sizeText, { color: isSelected ? '#FFF' : theme.text }]}>
                            {size}
                          </Text>
                          <Text style={[styles.sizeStock, { color: isSelected ? '#FFF' : theme.textSecondary }]}>
                            {isAvailable ? `${stock} left` : 'Out'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Add to Cart Button */}
                  <TouchableOpacity
                    style={[
                      styles.addToCartButton,
                      { backgroundColor: selectedSize ? theme.primary : theme.border },
                    ]}
                    onPress={addToCart}
                    disabled={!selectedSize}
                  >
                    <Ionicons name="cart" size={22} color="#FFF" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>

                  {/* Pickup Info */}
                  <View style={[styles.pickupInfo, { backgroundColor: theme.card }]}>
                    <Ionicons name="location" size={20} color={theme.primary} />
                    <Text style={[styles.pickupText, { color: theme.textSecondary }]}>
                      Pickup available at your gym center
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.cartModal, { backgroundColor: theme.background }]}>
            {/* Cart Header */}
            <View style={[styles.cartHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.cartHeaderLeft}>
                <Text style={[styles.cartTitle, { color: theme.text }]}>Your Cart</Text>
                <Text style={[styles.cartSubtitle, { color: theme.textSecondary }]}>
                  {getTotalItems()} items
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: theme.card }]}
                onPress={() => setShowCart(false)}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="cart-outline" size={100} color={theme.textSecondary} />
                <Text style={[styles.emptyCartTitle, { color: theme.text }]}>Your cart is empty</Text>
                <Text style={[styles.emptyCartSubtitle, { color: theme.textSecondary }]}>
                  Add some awesome gym gear!
                </Text>
                <TouchableOpacity
                  style={[styles.continueButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowCart(false)}
                >
                  <Text style={styles.continueButtonText}>Continue Shopping</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <FlatList
                  data={cart}
                  keyExtractor={(_, index) => index.toString()}
                  contentContainerStyle={styles.cartList}
                  renderItem={({ item, index }) => (
                    <View style={[styles.cartItem, { backgroundColor: theme.card }]}>
                      <View style={[styles.cartItemImage, { backgroundColor: theme.inputBg }]}>
                        <Ionicons name="shirt" size={30} color={theme.textSecondary} />
                      </View>
                      <View style={styles.cartItemInfo}>
                        <Text style={[styles.cartItemName, { color: theme.text }]} numberOfLines={1}>
                          {item.merchandise.name}
                        </Text>
                        <Text style={[styles.cartItemSize, { color: theme.textSecondary }]}>
                          Size: {item.size}
                        </Text>
                        <Text style={[styles.cartItemPrice, { color: theme.primary }]}>
                          ₹{item.merchandise.price.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.cartItemActions}>
                        <TouchableOpacity
                          style={[styles.qtyButton, { backgroundColor: theme.inputBg }]}
                          onPress={() => updateQuantity(index, -1)}
                        >
                          <Ionicons name="remove" size={18} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.qtyText, { color: theme.text }]}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={[styles.qtyButton, { backgroundColor: theme.inputBg }]}
                          onPress={() => updateQuantity(index, 1)}
                        >
                          <Ionicons name="add" size={18} color={theme.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />

                {/* Cart Footer */}
                <View style={[styles.cartFooter, { backgroundColor: theme.card }]}>
                  <View style={styles.cartTotalRow}>
                    <Text style={[styles.cartTotalLabel, { color: theme.textSecondary }]}>Total Amount</Text>
                    <Text style={[styles.cartTotalAmount, { color: theme.text }]}>
                      ₹{getTotalAmount().toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.checkoutButton, { backgroundColor: theme.primary }]}
                    onPress={handleProceed}
                    disabled={ordering}
                  >
                    {ordering ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Text style={styles.checkoutText}>Place Order</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                      </>
                    )}
                  </TouchableOpacity>
                  <Text style={[styles.pickupNote, { color: theme.textSecondary }]}>
                    🏋️ Pickup at gym • Pay on collection
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  heroTagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  heroIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  categoriesContainer: {
    marginTop: 20,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  productCount: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  placeholderImage: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productCategory: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sizeDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  sizeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreText: {
    fontSize: 10,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    fontSize: 14,
  },
  floatingCart: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartBadge: {
    backgroundColor: '#FFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartBadgeText: {
    color: '#E63946',
    fontSize: 14,
    fontWeight: 'bold',
  },
  floatingCartText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingCartPrice: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 280,
  },
  modalPlaceholder: {
    width: '100%',
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    padding: 24,
  },
  modalCategory: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  modalName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 6,
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  modalPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  inclTaxBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inclTaxText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  selectLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  sizeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    minWidth: 75,
  },
  sizeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sizeStock: {
    fontSize: 10,
    marginTop: 4,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 14,
    marginTop: 28,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  pickupText: {
    fontSize: 13,
    flex: 1,
  },
  cartModal: {
    maxHeight: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  cartHeaderLeft: {},
  cartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cartSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyCartSubtitle: {
    fontSize: 14,
  },
  continueButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  cartItemSize: {
    fontSize: 12,
    marginTop: 2,
  },
  cartItemPrice: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  cartFooter: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTotalLabel: {
    fontSize: 14,
  },
  cartTotalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 14,
  },
  checkoutText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  pickupNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
});
