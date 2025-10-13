import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
  Dimensions,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const panelWidth = width * 0.7;

export default function HomeScreen() {
  const {
    isDarkMode,
    toggleDarkMode,
    themeColors,
    fontSize,
    setFontSize,
    fontSizeMultiplier,
  } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const slideAnim = useRef(new Animated.Value(-panelWidth)).current;

  const openSettingsModal = () => {
    setShowSettings(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSettingsModal = () => {
    Animated.timing(slideAnim, {
      toValue: -panelWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSettings(false);
    });
  };

  const handleImageAnalysis = () => {
    router.push({
      pathname: "/(tabs)/explore",
      params: { showModal: "true" },
    });
  };

  const handleChat = () => {
    router.push("/(tabs)/chat");
  };

  const goToHome = () => {
    // 이미 홈 화면이므로 아무것도 하지 않음
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
        edges={["top", "left", "right", "bottom"]}
      >
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={themeColors.background}
        />
        {/* 상단 메뉴 바 */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={openSettingsModal}
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

        {/* 헤더 */}
        <View
          style={[
            styles.header,
            { backgroundColor: themeColors.headerBackground },
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: themeColors.text, fontSize: 36 * fontSizeMultiplier },
            ]}
          >
            홈픽스
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: themeColors.text, fontSize: 16 * fontSizeMultiplier },
            ]}
          >
            집안 문제 해결 전문가
          </Text>
        </View>

        <View style={styles.content}>
          {/* 메인 선택 버튼들 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.mainButton,
                { backgroundColor: themeColors.buttonBackground },
              ]}
              onPress={handleImageAnalysis}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require("@/assets/images/camera.png")}
                    style={[styles.buttonIcon, { tintColor: themeColors.text }]}
                  />
                </View>
                <Text
                  style={[
                    styles.buttonTitle,
                    {
                      color: themeColors.text,
                      fontSize: 20 * fontSizeMultiplier,
                    },
                  ]}
                >
                  사진으로 물어보기
                </Text>
                <Text
                  style={[
                    styles.buttonDescription,
                    {
                      color: themeColors.text,
                      fontSize: 14 * fontSizeMultiplier,
                    },
                  ]}
                >
                  문제가 있는 곳을 사진으로 찍어서{"\n"}정확한 해결책을
                  받아보세요
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mainButton,
                { backgroundColor: themeColors.buttonBackground },
              ]}
              onPress={handleChat}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Image
                    source={require("@/assets/images/add-image.png")}
                    style={[styles.buttonIcon, { tintColor: themeColors.text }]}
                  />
                </View>
                <Text
                  style={[
                    styles.buttonTitle,
                    {
                      color: themeColors.text,
                      fontSize: 20 * fontSizeMultiplier,
                    },
                  ]}
                >
                  채팅으로 물어보기
                </Text>
                <Text
                  style={[
                    styles.buttonDescription,
                    {
                      color: themeColors.text,
                      fontSize: 14 * fontSizeMultiplier,
                    },
                  ]}
                >
                  궁금한 집안 문제를{"\n"}직접 질문해보세요
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 하단 안내 */}
          <View style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                { color: themeColors.text, fontSize: 14 * fontSizeMultiplier },
              ]}
            >
              💡 더 정확한 답변을 위해 구체적으로 질문해주세요
            </Text>
          </View>
        </View>

        {/* 설정 모달 */}
        <Modal
          visible={showSettings}
          transparent={true}
          animationType="none"
          onRequestClose={closeSettingsModal}
        >
          <TouchableOpacity
            style={styles.settingsModalOverlay}
            activeOpacity={1}
            onPress={closeSettingsModal}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Animated.View
                style={[
                  styles.settingsPanel,
                  {
                    backgroundColor: `${themeColors.background}CC`, // 반투명
                    transform: [{ translateX: slideAnim }],
                  },
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
                    style={[
                      styles.closeButton,
                      { backgroundColor: themeColors.buttonBackground },
                    ]}
                    onPress={closeSettingsModal}
                  >
                    <Text
                      style={[
                        styles.closeButtonText,
                        { color: themeColors.text },
                      ]}
                    >
                      ✕
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.settingsContent}>
                  <TouchableOpacity
                    style={[
                      styles.settingsItem,
                      { borderBottomColor: themeColors.borderColor },
                    ]}
                    onPress={toggleDarkMode}
                  >
                    <View style={styles.settingsIcon}>
                      <View
                        style={[
                          styles.sunIcon,
                          { borderColor: themeColors.text },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.settingsText, { color: themeColors.text }]}
                    >
                      다크모드
                    </Text>
                    <View style={styles.toggleContainer}>
                      <View
                        style={[
                          styles.toggle,
                          { backgroundColor: themeColors.buttonBackground },
                          isDarkMode && styles.toggleActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.toggleThumb,
                            isDarkMode && styles.toggleThumbActive,
                          ]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.settingsItem,
                      { borderBottomColor: themeColors.borderColor },
                    ]}
                  >
                    <View style={styles.settingsIcon}>
                      <View style={styles.fontIcon}>
                        <Text
                          style={[styles.fontText, { color: themeColors.text }]}
                        >
                          A
                        </Text>
                        <Text
                          style={[
                            styles.fontTextSmall,
                            { color: themeColors.text },
                          ]}
                        >
                          A
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.settingsText, { color: themeColors.text }]}
                    >
                      글자크기
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.fontSizeButton,
                        { backgroundColor: themeColors.buttonBackground },
                        styles.fontSizeButtonActive,
                      ]}
                      onPress={() => {
                        const fontSizes: ("small" | "medium" | "large")[] = [
                          "small",
                          "medium",
                          "large",
                        ];
                        const currentIndex = fontSizes.indexOf(fontSize);
                        const nextIndex = (currentIndex + 1) % fontSizes.length;
                        setFontSize(fontSizes[nextIndex]);
                      }}
                    >
                      <Text
                        style={[
                          styles.fontSizeText,
                          { color: themeColors.text },
                        ]}
                      >
                        {fontSize === "small"
                          ? "작게"
                          : fontSize === "medium"
                          ? "보통"
                          : "크게"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.settingsItem,
                      { borderBottomColor: themeColors.borderColor },
                    ]}
                  >
                    <View style={styles.settingsIcon}>
                      <View style={styles.inquiryIcon}>
                        <View
                          style={[
                            styles.personIcon,
                            { backgroundColor: themeColors.text },
                          ]}
                        />
                        <View
                          style={[
                            styles.wrenchIcon,
                            { backgroundColor: themeColors.text },
                          ]}
                        />
                      </View>
                    </View>
                    <Text
                      style={[styles.settingsText, { color: themeColors.text }]}
                    >
                      문의하기
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  mainButton: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonIcon: {
    width: 30,
    height: 30,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  buttonDescription: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  // 설정 모달 스타일
  settingsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  settingsPanel: {
    width: panelWidth,
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
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
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
  // 아이콘 스타일
  sunIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFD700",
    borderWidth: 2,
  },
  fontIcon: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  fontText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 2,
  },
  fontTextSmall: {
    fontSize: 12,
    fontWeight: "bold",
  },
  inquiryIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  personIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 2,
  },
  wrenchIcon: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  // 토글 버튼 스타일
  toggleContainer: {
    marginLeft: "auto",
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#007AFF",
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  // 글자크기 토글 스타일
  fontSizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    marginLeft: "auto",
  },
  fontSizeButtonActive: {
    backgroundColor: "#007AFF",
  },
  fontSizeText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
