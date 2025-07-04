import React from 'react';
import { FlatList } from 'react-native';
import ReminderListItem from './ReminderListItem';

const ReminderList = ({ reminders, onPress, refreshing, onRefresh }) => {
  const renderItem = ({ item, index }) => (
    <ReminderListItem
      reminder={item}
      onPress={() => onPress(index)}
    />
  );

  return (
    <FlatList
      data={reminders}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingHorizontal: 10 }}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default ReminderList;
