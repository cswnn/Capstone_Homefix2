import axios from "axios";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Button, Image, ScrollView, Text, View } from "react-native";

export default function App() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [response, setResponse] = useState<{
    problem: string;
    location: string;
    solution: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== "granted" || mediaStatus !== "granted") {
        Alert.alert("카메라 및 갤러리 접근 권한이 필요합니다.");
      }
    })();
  }, []);
  const convertToJpegBase64 = async (uri: string) => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    return result.base64;
  };
  const handleImagePick = async (fromCamera: boolean) => {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        })
      : await ImagePicker.launchImageLibraryAsync({ 
        base64: true, 
        quality: 1,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
        // console.log(result);

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      // console.log(asset);
      setImageUri(asset.uri);

      try {
        const base64 = await convertToJpegBase64(asset.uri);
        console.log(base64?.substring(0,50));
        setBase64Data(base64 || null);
      } catch (err) {
      console.error("📛 base64 변환 실패:", err);
      Alert.alert("이미지를 처리할 수 없습니다.");
      }
    }
  };

  const uploadImage = async () => {
    if (!base64Data) return;

    try {
      console.log("업로드할 base64 길이:", base64Data?.length);
      const res = await axios.post("http://172.17.65.38:8000/analyze/", {
        image_base64: base64Data,
      }, {
        headers: { "Content-Type": "application/json" }
      });
      setResponse(res.data);
      if (response) {
      router.replace({
        pathname: "/(tabs)/result",
        params: response,
      });
    }
    } catch (error: any) {
      console.error("❌ axios 에러:", error?.message || error);
      Alert.alert("업로드 실패", "서버에 연결할 수 없습니다.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ marginTop: 100, padding: 20 }}>
      <Button title="📷 사진 촬영" onPress={() => handleImagePick(true)} />
      <View style={{ height: 10 }} />
      <Button title="📁 갤러리 선택" onPress={() => handleImagePick(false)} />

      {imageUri && (
        <>
          <Image
            source={{ uri: imageUri }}
            style={{ width: 200, height: 200, marginVertical: 10 }}
          />
          <Button title="서버로 전송" onPress={uploadImage} />
        </>
      )}

      {response && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ marginTop: 10, color: 'white' }}>문제: {response.problem}</Text>
          <Text style={{ color: 'white' }}>위치: {response.location}</Text>
          <Text style={{ color: 'white' }}>해결책: {response.solution}</Text>
        </View>
      )}
    </ScrollView>
  );
}
