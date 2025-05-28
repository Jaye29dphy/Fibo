import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import OwnerBottomTabs from "./BottomTabs";
import useOwnerFields from "../../hooks/useOwnerFields";
import { API_ENDPOINTS } from "@/constants/apiConfig";

export default function UpdateFieldInfo() {
    const router = useRouter();
    const { fields, loading, error, refreshFields } = useOwnerFields();
    const [fieldRatings, setFieldRatings] = useState<Record<number, number>>({}); // Corrected the state type back to Record<number, number>);

    // Hàm để lấy đánh giá chi tiết cho từng sân từ API
    const fetchFieldRatings = async () => {
        if (!fields || fields.length === 0) return;

        try {
            const ratings: Record<number, number> = {};

            for (const field of fields) {
                try {
                    // Sử dụng API để lấy đánh giá chính xác từ server
                    const response = await fetch(`${API_ENDPOINTS.GET_REVIEWS}/${field.field_id}`);
                    console.log(`Fetching rating for field ${field.field_id} from: ${API_ENDPOINTS.GET_REVIEWS}/${field.field_id}`);

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`Rating data for field ${field.field_id}:`, data);

                        // Ưu tiên sử dụng giá trị từ server nếu có
                        if (data && typeof data.rating === 'number') {
                            console.log(`Using server rating for field ${field.field_id}: ${data.rating}`);
                            ratings[field.field_id] = data.rating;
                        } else if (Array.isArray(data) && data.length > 0) {
                            // Tính toán giá trị trung bình nếu server trả về danh sách đánh giá
                            const sum = data.reduce((total, review) => total + parseFloat(review.rating || 0), 0);
                            const avgRating = sum / data.length;
                            console.log(`Calculated rating for field ${field.field_id}: ${avgRating}`);
                            ratings[field.field_id] = avgRating;
                        } else {
                            // Sử dụng giá trị từ data fields nếu không có từ API
                            ratings[field.field_id] = field.rating || 0;
                            console.log(`Using field object rating for field ${field.field_id}: ${field.rating || 0}`);
                        }
                    } else {
                        console.log(`Error fetching rating for field ${field.field_id}: ${response.status}`);
                        ratings[field.field_id] = field.rating || 0;
                    }
                } catch (error) {
                    console.error(`Error fetching rating for field ${field.field_id}:`, error);
                    ratings[field.field_id] = field.rating || 0;
                }
            }

            setFieldRatings(ratings);
        } catch (error) {
            console.error("Error fetching field ratings:", error);
        }
    };

    // Lấy đánh giá chi tiết khi danh sách sân được tải
    useEffect(() => {
        if (fields.length > 0) {
            fetchFieldRatings();
        }
    }, [fields]);

    // Format giá tiền
    const formatPrice = (price: number): string => {
        return `${price.toLocaleString('vi-VN')}đ/h`;
    };

    // Chuyển đổi loại sân sang tiếng Việt
    const getFieldTypeText = (sportType: string): string => {
        const typeMapping: Record<string, string> = {
            'football': 'Sân bóng đá',
            'basketball': 'Sân bóng rổ',
            'badminton': 'Sân cầu lông',
            'tennis': 'Sân tennis',
            'pickleball': 'Sân pickleball'
        };

        return typeMapping[sportType] || sportType;
    };

    // Hàm hiển thị rating dưới dạng sao
    const renderRatingStars = (field_id: number) => {
        const rating = fieldRatings[field_id] || fields.find(f => f.field_id === field_id)?.rating || 0;

        return (
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={rating >= star - 0.5 ? "star" : "star-outline"}
                        size={16}
                        color="#FFD700"
                    />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
          
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.title}>FIBO</Text>
                <Ionicons name="calendar-outline" size={24} color="#000" />
            </View>

           
            <View style={styles.subtitleRow}>
                <Text style={styles.subtitle}>Danh sách sân</Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={refreshFields}
                    disabled={loading}
                >
                    <Ionicons name="refresh" size={24} color="#3F51B5" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3F51B5" />
                    <Text style={styles.loadingText}>Đang tải danh sách sân...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refreshFields}>
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : fields.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="information-circle-outline" size={50} color="#3F51B5" />
                    <Text style={styles.emptyText}>Bạn chưa sở hữu sân nào.</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refreshFields} />
                    }
                >
                    {fields.map((field) => (
                        <TouchableOpacity
                            key={field.field_id}
                            style={styles.fieldCard}
                            onPress={() => router.push({
                                pathname: "/owner/field_details",
                                params: { fieldId: field.field_id }
                            })}
                        >
                            <Image source={{ uri: field.image_url }} style={styles.fieldImage} />
                            <View style={styles.fieldInfo}>
                                <Text style={styles.fieldName}>{field.name}</Text>
                                <Text style={styles.fieldType}>{getFieldTypeText(field.sport_type)}</Text>
                                <View style={styles.ratingContainer}>
                                    {renderRatingStars(field.field_id)}
                                    <Text style={styles.ratingText}>
                                        {(fieldRatings[field.field_id] || field.rating || 0).toFixed(1)}
                                    </Text>
                                    <View style={styles.statusBadge}>
                                        <Text style={[
                                            styles.statusText,
                                            field.status === 'available' ? styles.availableStatus : styles.unavailableStatus
                                        ]}>
                                            {field.status === 'available' ? 'Khả dụng' : 'Không khả dụng'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.price}>{formatPrice(field.price_per_hour)}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

           
            <OwnerBottomTabs />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingTop: 40,
        paddingBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#3F51B5",
    },
    subtitleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#3F51B5",
        flex: 1,
    },
    refreshButton: {
        padding: 5,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#3F51B5',
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    fieldCard: {
        flexDirection: "row",
        marginHorizontal: 15,
        marginVertical: 5,
        borderRadius: 10,
        backgroundColor: "#fff",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    fieldImage: {
        width: 100,
        height: 100,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
    },
    fieldInfo: {
        flex: 1,
        padding: 10,
    },
    fieldName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000",
    },
    fieldType: {
        fontSize: 14,
        color: "#666",
        marginTop: 2,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },
    ratingText: {
        marginLeft: 5,
        fontSize: 14,
        color: "#000",
        marginRight: 10,
    },
    price: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#3F51B5",
        marginTop: 5,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "bold",
    },
    availableStatus: {
        color: "#4CAF50",
    },
    unavailableStatus: {
        color: "#F44336",
    },
    starsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 5,
    },
});