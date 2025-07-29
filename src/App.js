import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Switch, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const Stack = createNativeStackNavigator();

// 授業入力フォームコンポーネント
function CourseForm({ navigation, route }) {
  const [name, setName] = useState('');
  const [testScore, setTestScore] = useState('');
  const [assignmentScore, setAssignmentScore] = useState('');
  const [assignmentDone, setAssignmentDone] = useState(false);

  const handleSubmit = () => {
    if (!name || testScore === '' || assignmentScore === '') {
      Alert.alert('入力エラー', 'すべての項目を入力してください。');
      return;
    }
    const newCourse = {
      id: Date.now().toString(),
      name,
      testScore: parseFloat(testScore),
      assignmentScore: parseFloat(assignmentScore),
      assignmentDone
    };
    route.params?.onSave(newCourse);
    navigation.goBack();
  };

  return (
    <View style={{ padding: 16 }}>
      <Text>授業名:</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="例：数学"
        style={{ borderWidth: 1, padding: 8, marginBottom: 12 }}
      />
      <Text>テスト点:</Text>
      <TextInput
        value={testScore}
        onChangeText={setTestScore}
        keyboardType="numeric"
        placeholder="例：70"
        style={{ borderWidth: 1, padding: 8, marginBottom: 12 }}
      />
      <Text>課題点:</Text>
      <TextInput
        value={assignmentScore}
        onChangeText={setAssignmentScore}
        keyboardType="numeric"
        placeholder="例：20"
        style={{ borderWidth: 1, padding: 8, marginBottom: 12 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text>課題提出完了:</Text>
        <Switch value={assignmentDone} onValueChange={setAssignmentDone} style={{ marginLeft: 8 }} />
      </View>
      <Button title="保存" onPress={handleSubmit} />
    </View>
  );
}

// 授業詳細表示コンポーネント
function CourseDetail({ route }) {
  const { course } = route.params;
  const isPassed = (course.testScore + course.assignmentScore >= 60) && (course.testScore >= 60) && course.assignmentDone;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>授業名: {course.name}</Text>
      <Text>テスト点: {course.testScore}</Text>
      <Text>課題点: {course.assignmentScore}</Text>
      <Text>課題提出: {course.assignmentDone ? '済' : '未'}</Text>
      <Text style={{ fontSize: 16, marginTop: 12 }}>
        単位取得: {isPassed ? '可能' : '不可'}
      </Text>
    </View>
  );
}

// 授業項目（1レコード）表示コンポーネント
function CourseItem({ course, onDelete, navigation }) {
  const isPassed = (course.testScore + course.assignmentScore >= 60) && (course.testScore >= 60) && course.assignmentDone;
  
  return (
    <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#ccc' }}>
      <Text style={{ fontSize: 16 }}>{course.name}</Text>
      <Text>単位取得: {isPassed ? '◯' : '✕'}</Text>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <Button
          title="詳細"
          onPress={() => navigation.navigate('CourseDetail', { course })}
        />
        <View style={{ width: 12 }} />
        <Button title="削除" color="red" onPress={() => onDelete(course.id)} />
      </View>
    </View>
  );
}

// CSV出力ボタンコンポーネント
function ExportCSVButton({ courses }) {
  const handleExport = async () => {
    if(courses.length === 0){
      Alert.alert('エクスポート', '授業データがありません。');
      return;
    }
    const header = '授業名,テスト点,課題点,課題提出,単位取得\n';
    const rows = courses.map(c =>
      `${c.name},${c.testScore},${c.assignmentScore},${c.assignmentDone ? '済' : '未'},${(c.testScore + c.assignmentScore >= 60 && c.testScore >= 60 && c.assignmentDone) ? '◯' : '✕'}`
    );
    const csv = header + rows.join('\n');

    const fileUri = FileSystem.documentDirectory + 'courses.csv';
    try {
      await FileSystem.writeAsStringAsync(fileUri, csv);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('CSV出力エラー', error.message);
    }
  };

  return <Button title="CSV出力" onPress={handleExport} />;
}

// 授業一覧表示コンポーネント
function CourseList({ navigation }) {
  const [courses, setCourses] = useState([]);

  const addCourse = (course) => setCourses([...courses, course]);

  const deleteCourse = (id) => setCourses(courses.filter(course => course.id !== id));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <Button
          title="授業を追加"
          onPress={() => navigation.navigate('AddCourse', { onSave: addCourse })}
        />
      </View>
      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CourseItem course={item} onDelete={deleteCourse} navigation={navigation} />
        )}
      />
      <View style={{ padding: 16 }}>
        <ExportCSVButton courses={courses} />
      </View>
    </View>
  );
}

// メインコンポーネント
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Courses" component={CourseList} options={{ title: '単位取得判定アプリ' }} />
        <Stack.Screen name="AddCourse" component={CourseForm} options={{ title: '授業登録' }} />
        <Stack.Screen name="CourseDetail" component={CourseDetail} options={{ title: '授業詳細' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
