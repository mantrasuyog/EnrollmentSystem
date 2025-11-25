import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'
import { colors } from '../common/colors'

export interface RadioButtonProps {
  id: string
  label: string
  value?: string
}

interface CustomRadioGroupProps {
  radioButtons: RadioButtonProps[]
  onPress: (id: string) => void
  selectedId: string
  containerStyle?: object
}

const CustomRadioGroup: React.FC<CustomRadioGroupProps> = ({
  radioButtons,
  onPress,
  selectedId,
  containerStyle
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {radioButtons.map((button) => (
        <TouchableOpacity
          key={button.id}
          style={styles.radioButton}
          onPress={() => onPress(button.id)}
          activeOpacity={0.7}
        >
          <View style={styles.radioCircle}>
            {selectedId === button.id && (
              <View style={styles.radioCircleInner} />
            )}
          </View>
          <Text style={styles.radioLabel}>{button.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.darkText,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  radioCircleInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.purple1
  },
  radioLabel: {
    fontSize: 14,
    color: colors.darkText,
    fontWeight: '500'
  }
})

export default CustomRadioGroup
