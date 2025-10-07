import TypingText from "@/components/TypingText";
import { createApiClient } from "@/config/api";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

interface RecoItem {
  title: string;
  price?: number | null;
  link: string;
  imageUrl?: string | null;
  rating?: number | null;
  ad?: boolean;
}

interface RecoGroup {
  group: string;
  required: boolean;
  items: RecoItem[];
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean; // 타이핑 효과 여부
  recoGroups?: RecoGroup[]; // 제품/준비물 추천 결과
}

export default function ChatScreen() {
  const { themeColors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "안녕하세요! 홈 수리 관련해서 도움이 필요하시면 언제든 말씀해주세요. 🏠",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const goToHome = () => {
    router.replace("/");
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // 사용자 메시지 생성
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const apiClient = createApiClient();
      const response = await apiClient.post("/chat/", {
        message: inputText.trim(),
      });

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        isUser: false,
        timestamp: new Date(),
        isTyping: true, // 타이핑 효과
      };

      setMessages((prev) => [...prev, botMessage]);

      // 준비물/제품 추천도 함께 요청 (사용자 질문 기반)
      try {
        const recoRes = await apiClient.post("/recommend/", {
          problem: inputText.trim(),
          location: "",
        });
        const groups: RecoGroup[] = recoRes?.data?.groups || [];
        if (groups.length > 0) {
          const recoMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: "아래 추천 준비물을 참고해 보세요.",
            isUser: false,
            timestamp: new Date(),
            isTyping: true,
            recoGroups: groups,
          };
          setMessages((prev) => [...prev, recoMessage]);
        }
      } catch (e) {
        // 추천 실패는 무시하고 채팅만 표시
        console.warn("추천 요청 실패", e);
      }
    } catch (error: any) {
      console.error("채팅 에러:", error?.message || error);
      Alert.alert("오류", "메시지를 전송할 수 없습니다.");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.",
        isUser: false,
        timestamp: new Date(),
        isTyping: true, // 타이핑 효과
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputText("");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.isUser ? styles.userMessage : styles.botMessage,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  {message.text &&
                    (message.isTyping && !message.isUser ? (
                      <TypingText
                        text={message.text}
                        speed={30}
                        style={[
                          styles.messageText,
                          message.isUser ? styles.userText : styles.botText,
                          { color: themeColors.text },
                        ]}
                        onComplete={() => {
                          setMessages((prev) =>
                            prev.map((msg) =>
                              msg.id === message.id
                                ? { ...msg, isTyping: false }
                                : msg
                            )
                          );
                        }}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.messageText,
                          message.isUser ? styles.userText : styles.botText,
                          { color: themeColors.text },
                        ]}
                      >
                        {message.text}
                      </Text>
                    ))}

                  {/* 준비물/제품 추천 카드 렌더링 */}
                  {!message.isUser && message.recoGroups && message.recoGroups.length > 0 && (
                    <View style={[styles.recoCard, { borderColor: themeColors.borderColor }]}> 
                      <Text style={[styles.recoTitle, { color: themeColors.text }]}>준비물 추천</Text>
                      <View style={styles.recoGroupsContainer}>
                        {message.recoGroups.map((g, idx) => (
                          <View key={`${message.id}-g-${idx}`} style={styles.recoGroupRow}>
                            <View style={styles.recoGroupHeader}>
                              <Text style={[styles.recoGroupName, { color: themeColors.text }]}>{g.group}</Text>
                              <Text style={[styles.recoRequired, { color: themeColors.text }]}>{g.required ? "필수" : "선택"}</Text>
                            </View>
                            <View style={styles.recoItems}>
                              {g.items.map((it, jdx) => (
                                <TouchableOpacity
                                  key={`${message.id}-g-${idx}-i-${jdx}`}
                                  style={[styles.recoItem, { borderColor: themeColors.borderColor }]}
                                  onPress={() => Linking.openURL(it.link)}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[styles.recoItemTitle, { color: themeColors.text }]} numberOfLines={1}>{it.title}</Text>
                                  <View style={styles.recoMetaRow}>
                                    {typeof it.price === "number" && (
                                      <Text style={[styles.recoMeta, { color: themeColors.text }]}>{it.price.toLocaleString()}원</Text>
                                    )}
                                    {typeof it.rating === "number" && (
                                      <Text style={[styles.recoMeta, { color: themeColors.text }]}>★ {it.rating.toFixed(1)}</Text>
                                    )}
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.timestamp,
                    message.isUser ? styles.userTimestamp : styles.botTimestamp,
                    { color: themeColors.text },
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageContainer, styles.botMessage]}>
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <Text
                    style={[
                      styles.messageText,
                      styles.botText,
                      { color: themeColors.text },
                    ]}
                  >
                    입력 중...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: themeColors.inputBackground,
                  color: themeColors.text,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="홈 수리 관련 질문을 입력하세요..."
              placeholderTextColor={themeColors.text}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Text style={styles.sendButtonText}>전송</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

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
    backgroundColor: "#f5f5f5",
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
  keyboardContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  botMessage: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "white",
  },
  botText: {},
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
  userTimestamp: {
    textAlign: "right",
  },
  botTimestamp: {
    textAlign: "left",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
