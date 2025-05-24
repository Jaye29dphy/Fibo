import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { getSubscriptionHistory } from '@/constants/apiService';
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';

interface Subscription {
  subscription_id: number;
  owner_id: number;
  plan_id: number;
  plan_name: string;
  price: number;
  max_fields: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired';
  description?: string;
}

const SubscriptionHistory = () => {
  const [history, setHistory] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading subscription history:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };
  
  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VND";
  };
  
  const renderItem = ({ item }: { item: Subscription }) => {
    return (
      <TouchableOpacity 
        style={styles.subscriptionItem} 
        onPress={() => {
          setSelectedSubscription(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.subscriptionHeader}>
          <Text style={[
            styles.planName,
            item.plan_name.toLowerCase().includes('pro') ? styles.proPlan : 
            item.plan_name.toLowerCase().includes('classic') ? styles.classicPlan : 
            styles.basicPlan
          ]}>
            {item.plan_name}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'active' ? '#e6f7f2' : '#ffeeee' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.status === 'active' ? '#42ba96' : '#ff4d4d' }
            ]}>
              {item.status === 'active' ? 'Còn hạn' : 'Hết hạn'}
            </Text>
          </View>
        </View>
        
        <View style={styles.subscriptionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#777" />
            <Text style={styles.detailLabel}>Từ:</Text>
            <Text style={styles.detailValue}>{formatDate(item.start_date)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color="#777" />
            <Text style={styles.detailLabel}>Đến:</Text>
            <Text style={styles.detailValue}>{formatDate(item.end_date)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử gói đăng ký</Text>
        <TouchableOpacity onPress={loadHistory}>
          <Ionicons name="refresh" size={20} color="#42ba96" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#42ba96" style={styles.loader} />
      ) : history.length > 0 ? (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.subscription_id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="history" size={40} color="#ddd" />
          <Text style={styles.emptyText}>Chưa có lịch sử đăng ký</Text>
        </View>
      )}
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chi tiết gói đăng ký</Text>
            
            {selectedSubscription && (
              <>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Tên gói:</Text>
                  <Text style={[
                    styles.modalValue,
                    selectedSubscription.plan_name.toLowerCase().includes('pro') ? styles.proPlan :
                    selectedSubscription.plan_name.toLowerCase().includes('classic') ? styles.classicPlan :
                    styles.basicPlan
                  ]}>
                    {selectedSubscription.plan_name}
                  </Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Trạng thái:</Text>
                  <Text style={[
                    styles.modalValue,
                    selectedSubscription.status === 'active' ? styles.activeStatus : styles.expiredStatus
                  ]}>
                    {selectedSubscription.status === 'active' ? 'Còn hạn' : 'Hết hạn'}
                  </Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Giá:</Text>
                  <Text style={styles.modalValue}>{formatPrice(selectedSubscription.price)}</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Ngày bắt đầu:</Text>
                  <Text style={styles.modalValue}>{formatDate(selectedSubscription.start_date)}</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Ngày kết thúc:</Text>
                  <Text style={styles.modalValue}>{formatDate(selectedSubscription.end_date)}</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Số sân tối đa:</Text>
                  <Text style={styles.modalValue}>{selectedSubscription.max_fields}</Text>
                </View>
                
                {selectedSubscription.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Mô tả:</Text>
                    <Text style={styles.descriptionText}>{selectedSubscription.description}</Text>
                  </View>
                )}
              </>
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  loader: {
    marginTop: 30,
  },
  listContainer: {
    paddingBottom: 20,
  },
  subscriptionItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  proPlan: {
    color: '#42ba96',
  },
  classicPlan: {
    color: '#f59f00',
  },
  basicPlan: {
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionDetails: {
    marginTop: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#777',
    marginLeft: 5,
    marginRight: 5,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalLabel: {
    fontSize: 15,
    color: '#777',
  },
  modalValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  activeStatus: {
    color: '#42ba96',
  },
  expiredStatus: {
    color: '#ff4d4d',
  },
  descriptionContainer: {
    marginTop: 15,
  },
  descriptionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#777',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#42ba96',
    borderRadius: 5,
    paddingVertical: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SubscriptionHistory;
