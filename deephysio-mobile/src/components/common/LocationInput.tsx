import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { MapPin, Check, ChevronDown, X } from 'lucide-react-native';
import Colors from '../../constants/colors';

interface LocationInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeLocation: (location: string) => void;
  required?: boolean;
  helper?: string;
}

const COMMON_LOCATIONS = [
  // Indore Hub & Major localities
  'Indore, Madhya Pradesh',
  'Vijay Nagar, Indore',
  'Palasia / Old Palasia, Indore',
  'Bhawarkua, Indore',
  'Rajendra Nagar, Indore',
  'Bengali Square, Indore',
  'Annapurna Road, Indore',
  'Scheme No. 54 / 78, Indore',
  'Super Corridor, Indore',
  'Rau / Bypass Road, Indore',
  'Geeta Bhawan, Indore',
  'Sapna Sangeeta, Indore',
  'Khajrana, Indore',
  'Sudama Nagar, Indore',
  'Mhow (Dr. Ambedkar Nagar)',
  // Other Central & Major Cities
  'Bhopal, Madhya Pradesh',
  'Ujjain, Madhya Pradesh',
  'Dewas, Madhya Pradesh',
  'Jabalpur, Madhya Pradesh',
  'Gwalior, Madhya Pradesh',
  'Mumbai, Maharashtra',
  'Pune, Maharashtra',
  'New Delhi, Delhi NCR',
  'Bengaluru, Karnataka',
  'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan',
];

export default function LocationInput({
  label = 'Residential Address / City',
  placeholder = 'Type address or select city/locality...',
  value,
  onChangeLocation,
  required = false,
  helper,
}: LocationInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter suggestions based on query
  const suggestions = useMemo(() => {
    if (!value.trim()) {
      return COMMON_LOCATIONS.slice(0, 8);
    }
    const q = value.toLowerCase().trim();
    const matched = COMMON_LOCATIONS.filter((loc) => loc.toLowerCase().includes(q));
    return matched.length > 0 ? matched : COMMON_LOCATIONS.slice(0, 6);
  }, [value]);

  const handleSelectLocation = (loc: string) => {
    onChangeLocation(loc);
    setShowDropdown(false);
  };

  return (
    <View style={styles.container}>
      {!!label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.requiredStar}> *</Text>}
          <Text style={styles.optionalBadge}> (Dropdown Suggestions)</Text>
        </View>
      )}

      <View
        style={[
          styles.inputBox,
          isFocused && styles.inputBoxFocused,
          showDropdown && styles.inputBoxOpen,
        ]}
      >
        <MapPin size={18} color={isFocused ? Colors.primary : Colors.slate} style={styles.pinIcon} />

        <TextInput
          style={styles.textInput}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={Colors.slate}
          onChangeText={(text) => {
            onChangeLocation(text);
            if (!showDropdown) setShowDropdown(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setShowDropdown(true);
          }}
          onBlur={() => setIsFocused(false)}
        />

        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => onChangeLocation('')}
            activeOpacity={0.7}
          >
            <X size={16} color={Colors.slate} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.dropdownToggle}
          onPress={() => setShowDropdown(!showDropdown)}
          activeOpacity={0.7}
        >
          <ChevronDown
            size={18}
            color={Colors.slate}
            style={{ transform: [{ rotate: showDropdown ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>

      {/* Suggestion Dropdown */}
      {showDropdown && (
        <View style={styles.dropdownMenu}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownHeaderText}>Select Quick City / Area:</Text>
            <TouchableOpacity onPress={() => setShowDropdown(false)} activeOpacity={0.7}>
              <Text style={styles.dropdownCloseText}>Close ✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.dropdownScroll}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="always"
          >
            {suggestions.map((loc, idx) => {
              const isSelected = value.toLowerCase() === loc.toLowerCase();
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                  onPress={() => handleSelectLocation(loc)}
                  activeOpacity={0.7}
                >
                  <MapPin
                    size={14}
                    color={isSelected ? Colors.primary : Colors.slate}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.dropdownItemText,
                      isSelected && styles.dropdownItemTextActive,
                    ]}
                  >
                    {loc}
                  </Text>
                  {isSelected && (
                    <Check size={16} color={Colors.primary} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {!!helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  requiredStar: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
  optionalBadge: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputBoxFocused: {
    borderColor: Colors.primary,
  },
  inputBoxOpen: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  pinIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.dark,
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 4,
    marginRight: 4,
  },
  dropdownToggle: {
    padding: 4,
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: Colors.border,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
    textTransform: 'uppercase',
  },
  dropdownCloseText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  dropdownScroll: {
    maxHeight: 160,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  dropdownItemText: {
    fontSize: 13,
    color: Colors.dark,
    flex: 1,
  },
  dropdownItemTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 4,
  },
});
