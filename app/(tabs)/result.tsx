import { useTheme } from "@/contexts/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getApiClient } from "@/config/api";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function ResultScreen() {
  const { themeColors } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [recoLoading, setRecoLoading] = useState(false);
  const [recoError, setRecoError] = useState<string | null>(null);
  const [recoGroups, setRecoGroups] = useState<
    { group: string; required: boolean; items: { title: string; price?: number | null; link: string; imageUrl?: string | null; rating?: number | null; ad?: boolean }[] }[]
  >([]);
  // 라우터에서 전달받은 파라미터들
  const params = useLocalSearchParams();

  const {
    problem = "분석 결과 없음",
    location = "위치 정보 없음",
    solution = "해결책 정보 없음",
    user_image_uri = "",
  } = params;

  const goToHome = () => {
    router.replace("/");
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setRecoLoading(true);
        setRecoError(null);
        const api = await getApiClient();
        const res = await api.post("/recommend/", { problem, location });
        setRecoGroups(res.data.groups || []);
      } catch (e: any) {
        setRecoError("추천 정보를 불러오지 못했습니다");
      } finally {
        setRecoLoading(false);
      }
    };
    fetchRecommendations();
  }, [problem, location]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={["top", "left", "right", "bottom"]}
      >
        {/* 상단 메뉴 바 */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowSettings(true)}
          >
            <View style={styles.menuIcon}>
              <View
                style={[styles.menuLine, { backgroundColor: themeColors.text }]}
              />
              <View
                style={[styles.menuLine, { backgroundColor: themeColors.text }]}
              />
              <View
                style={[styles.menuLine, { backgroundColor: themeColors.text }]}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.spacer} />

          <TouchableOpacity style={styles.homeButton} onPress={goToHome}>
            <View style={styles.homeIcon}>
              <View
                style={[
                  styles.homeRoof,
                  { borderBottomColor: themeColors.text },
                ]}
              />
              <View
                style={[styles.homeBase, { backgroundColor: themeColors.text }]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.header,
            { backgroundColor: themeColors.headerBackground },
          ]}
        >
          <Text style={[styles.title, { color: themeColors.text }]}>
            사진으로 물어보기
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.text }]}>
            AI가 분석한 결과입니다
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 이미지 표시 영역 */}
          <View style={styles.imageContainer}>
            {user_image_uri && typeof user_image_uri === "string" ? (
              <Image source={{ uri: user_image_uri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>분석된 이미지</Text>
              </View>
            )}
          </View>

          {/* 문제 유형 카드 */}
          <View
            style={[
              styles.resultCard,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>
              문제: {problem}
            </Text>
          </View>

          {/* 해결책 카드 */}
          <View
            style={[
              styles.resultCard,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>
              해결책
            </Text>
            <Text style={[styles.solutionText, { color: themeColors.text }]}>
              {solution}
            </Text>
          </View>

          {/* 제품 추천 카드 */}
          <View
            style={[
              styles.resultCard,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>제품 추천</Text>
            {recoLoading ? (
              <Text style={{ color: themeColors.text }}>불러오는 중…</Text>
            ) : recoError ? (
              <Text style={{ color: themeColors.text }}>{recoError}</Text>
            ) : (
              <View style={styles.recoTable}>
                {recoGroups.map((g, idx) => (
                  <View key={idx} style={[styles.recoRow, { borderColor: themeColors.borderColor }]}> 
                    <View style={styles.recoColName}>
                      <Text style={[styles.recoGroup, { color: themeColors.text }]}>{g.group}</Text>
                      <Text style={[styles.recoReq, { color: themeColors.text }]}>{g.required ? "필수" : "선택"}</Text>
                    </View>
                    <View style={styles.recoColItems}>
                      {g.items.map((it, i) => (
                        <View key={i} style={styles.recoItem}>
                          {it.imageUrl ? (
                            <Image source={{ uri: it.imageUrl }} style={styles.recoThumb} />
                          ) : (
                            <View style={[styles.recoThumb, { backgroundColor: "#eee" }]}>
                              <Text style={styles.recoNoImage}>📦</Text>
                            </View>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={2} style={[styles.recoTitle, { color: themeColors.text }]}>
                              {i + 1}. {it.title} {it.ad ? "[ad]" : ""}
                            </Text>
                            <View style={styles.recoInfo}>
                              {it.price && (
                                <Text style={[styles.recoPrice, { color: themeColors.text }]}>
                                  {it.price.toLocaleString()}원
                                </Text>
                              )}
                              {it.rating && (
                                <Text style={[styles.recoRating, { color: themeColors.text }]}>
                                  ⭐ {it.rating.toFixed(1)}
                                </Text>
                              )}
                            </View>
                            <Text style={[styles.recoLink, { color: themeColors.text }]} onPress={() => {
                              // 웹 브라우저 열기
                              // Linking을 동적 import하여 웹/네이티브 양쪽 지원
                              import("react-native").then(({ Linking }) => Linking.openURL(it.link));
                            }}>🔗 상품 보기</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* 설정 모달 */}
        <Modal
          visible={showSettings}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.settingsPanel,
                { backgroundColor: themeColors.background },
              ]}
            >
              <View
                style={[
                  styles.settingsHeader,
                  { borderBottomColor: themeColors.borderColor },
                ]}
              >
                <Text
                  style={[styles.settingsTitle, { color: themeColors.text }]}
                >
                  HomeFix
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.settingsContent}>
                <TouchableOpacity
                  style={styles.settingsItem}
                  onPress={() => {
                    setShowSettings(false);
                    goToHome();
                  }}
                >
                  <View style={styles.settingsIcon}>
                    <View style={styles.homeIcon}>
                      <View
                        style={[
                          styles.homeRoof,
                          { borderBottomColor: themeColors.text },
                        ]}
                      />
                      <View
                        style={[
                          styles.homeBase,
                          { backgroundColor: themeColors.text },
                        ]}
                      />
                    </View>
                  </View>
                  <Text
                    style={[styles.settingsText, { color: themeColors.text }]}
                  >
                    홈으로
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  spacer: {
    flex: 1,
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    width: 20,
    height: 15,
    justifyContent: "space-between",
  },
  menuLine: {
    height: 2,
    borderRadius: 1,
  },
  homeButton: {
    padding: 5,
  },
  homeIcon: {
    width: 20,
    height: 15,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginBottom: 2,
  },
  homeBase: {
    width: 12,
    height: 6,
    borderRadius: 1,
  },
  // 설정 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  settingsPanel: {
    width: "70%",
    height: "100%",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#666",
  },
  settingsContent: {
    padding: 20,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  settingsIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsText: {
    fontSize: 16,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 300,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: "#666",
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "#000",
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#000",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  solutionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  // 추천 테이블
  recoTable: {
    borderTopWidth: 1,
    borderColor: "#000",
  },
  recoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 10,
  },
  recoColName: {
    width: 100,
    paddingRight: 10,
  },
  recoGroup: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  recoReq: {
    opacity: 0.8,
  },
  recoColItems: {
    flex: 1,
    gap: 8,
  },
  recoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  recoThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  recoNoImage: {
    fontSize: 20,
    textAlign: "center",
    lineHeight: 50,
  },
  recoTitle: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "500",
  },
  recoInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 10,
  },
  recoPrice: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#e74c3c",
  },
  recoRating: {
    fontSize: 12,
    color: "#f39c12",
  },
  recoLink: {
    textDecorationLine: "underline",
    fontSize: 12,
    color: "#3498db",
  },
});
