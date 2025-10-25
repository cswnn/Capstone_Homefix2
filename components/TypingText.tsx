import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { renderFormattedText } from "@/utils/textFormatting";

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
