import React, { useEffect, useState } from "react";
import { Text } from "react-native";

interface TypingTextProps {
  text: string;
  speed?: number; // 타이핑 속도 (ms)
  onComplete?: () => void;
  style?: any;
}

// **텍스트** 형태의 강조 표시를 굵게 표시하는 함수 (타이핑 중에도 적용)
const renderFormattedText = (text: string, textStyle: any) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      // **텍스트** 형태의 부분을 굵게 표시
      const boldText = part.slice(2, -2); // ** 제거
      return (
        <Text key={index} style={[textStyle, { fontWeight: "bold" }]}>
          {boldText}
        </Text>
      );
    }
    return (
      <Text key={index} style={textStyle}>
        {part}
      </Text>
    );
  });
};

export default function TypingText({
  text,
  speed = 50,
  onComplete,
  style,
}: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // 텍스트가 변경되면 리셋
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
  }, [text]);

  return (
    <Text style={style}>
      {renderFormattedText(displayedText, style)}
      {currentIndex < text.length && <Text style={{ opacity: 0.5 }}>|</Text>}
    </Text>
  );
}
