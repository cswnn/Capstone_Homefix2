import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

type ResponseData = {
  problem: string;
    location: string;
    solution: string;
};

export default function Result() {
    const params = useLocalSearchParams<ResponseData>();
  return (
    <ScrollView contentContainerStyle={{ marginTop: 100, padding: 20 }}>
        <View style={{ marginTop: 20 }}>
            <Text style={{ marginTop: 10, color: 'white' }}>문제: {params.problem}</Text>
            <Text style={{ color: 'white' }}>위치: {params.location}</Text>
            <Text style={{ color: 'white' }}>해결책: {params.solution}</Text>
        </View>
    </ScrollView>
  );
}