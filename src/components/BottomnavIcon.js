import React from 'react'
import Ionicons from "@expo/vector-icons/Ionicons"

const BottomnavIcon = ({name, color}) => {
  return (
    <Ionicons
      size={28}
      style={{ marginBottom: -3 }}
      name={name}
      color={color}
    />
  )
}

export default BottomnavIcon