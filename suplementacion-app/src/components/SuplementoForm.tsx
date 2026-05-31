import { useState } from 'react';
import { Text, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { CategoriaSuplemento } from '../types';
import { formStyles } from '../styles/forms';
import { COLORS, CATEGORIES } from '../constants/colors';

const FRECUENCIAS_ARRAY = ['diario', 'semanal', 'mensual'] as const;

interface SuplementoFormProps {
  navigation: any;
  initialData?: {
    nombre?: string;
    dosis?: string;
    frecuencia?: 'diario' | 'semanal' | 'mensual';
    hora?: string;
    categoria?: CategoriaSuplemento;
    notas?: string;
    activo?: boolean;
  };
  isEditing?: boolean;
  onSubmit: (data: {
    nombre: string;
    dosis: string;
    frecuencia: 'diario' | 'semanal' | 'mensual';
    hora: string;
    categoria: CategoriaSuplemento;
    notas: string;
    activo: boolean;
  }) => Promise<void>;
  loading?: boolean;
  submitButtonText?: string;
}

export default function SuplementoForm({
  navigation,
  initialData,
  isEditing = false,
  onSubmit,
  loading = false,
  submitButtonText,
}: SuplementoFormProps) {
  const [nombre, setNombre] = useState(initialData?.nombre || '');
  const [dosis, setDosis] = useState(initialData?.dosis || '');
  const [frecuencia, setFrecuencia] = useState<typeof FRECUENCIAS[number]>(
    initialData?.frecuencia || 'diario'
  );
  const [hora, setHora] = useState(initialData?.hora || '');
  const [categoria, setCategoria] = useState<CategoriaSuplemento>(
    initialData?.categoria || 'vitaminas'
  );
  const [notas, setNotas] = useState(initialData?.notas || '');
  const [activo, setActivo] = useState(initialData?.activo ?? true);

  const handleGuardado = async () => {
    await onSubmit({
      nombre,
      dosis,
      frecuencia,
      hora,
      categoria,
      notas,
      activo,
    });
  };

  return (
    <ScrollView style={formStyles.container} contentContainerStyle={formStyles.content}>
      <CustomInput label="Nombre" placeholder="Ej: vitamina D3" value={nombre} onChangeText={setNombre} />

      <CustomInput label="Dosis" placeholder="Ej: 5000 UI" value={dosis} onChangeText={setDosis} />

      <View style={formStyles.labelContainer}>
        <Text style={formStyles.label}>Frecuencia</Text>
      </View>

      <View style={formStyles.pillContainer}>
        {FRECUENCIAS_ARRAY.map((f) => (
          <TouchableOpacity
            key={f}
            style={[formStyles.pill, frecuencia === f && formStyles.pillSelected]}
            onPress={() => setFrecuencia(f)}>
            <Text style={[formStyles.pillText, frecuencia === f && formStyles.pillTextSelected]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <CustomInput
        label="Hora (opcional)"
        placeholder="Ej: 08:00"
        value={hora}
        onChangeText={setHora}
        keyboardType="numeric"
      />

      <View style={formStyles.labelContainer}>
        <Text style={formStyles.label}>Categoría</Text>
      </View>

      <View style={formStyles.categoryContainer}>
        {Object.entries(CATEGORIES).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[formStyles.categoryChip, categoria === key && { backgroundColor: value.color }]}
            onPress={() => setCategoria(key as CategoriaSuplemento)}>
            <Text style={[formStyles.categoryText, categoria === key && { color: COLORS.background }]}>
              {value.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isEditing && (
        <>
          <View style={formStyles.labelContainer}>
            <Text style={formStyles.label}>Estado</Text>
          </View>
          <View style={formStyles.pillContainer}>
            <TouchableOpacity
              style={[formStyles.pill, activo && formStyles.pillSelected]}
              onPress={() => setActivo(true)}>
              <Text style={[formStyles.pillText, activo && formStyles.pillTextSelected]}>Activo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[formStyles.pill, !activo && formStyles.pillSelected]}
              onPress={() => setActivo(false)}>
              <Text style={[formStyles.pillText, !activo && formStyles.pillTextSelected]}>Inactivo</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <CustomInput
        label="Notas (opcional)"
        placeholder="Notas adicionales..."
        value={notas}
        onChangeText={setNotas}
        multiline
        numberOfLines={4}
        style={formStyles.textArea}
      />

      <TouchableOpacity
        style={[formStyles.button, loading && formStyles.buttonDisabled]}
        onPress={handleGuardado}
        disabled={loading}>
        <Text style={formStyles.buttonText}>
          {loading
            ? 'Guardando...'
            : submitButtonText || (isEditing ? 'Actualizar Suplemento' : 'Guardar Suplemento')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

interface CustomInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'email-address' | 'numeric' | 'default';
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
}

function CustomInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  multiline = false,
  numberOfLines,
  style,
}: CustomInputProps) {
  return (
    <View style={formStyles.inputContainer}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        style={[formStyles.input, style]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );
}
