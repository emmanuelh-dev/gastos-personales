import type { IoniconName } from '@/components/CategoryIcon';
import { Colors } from '@/constants/theme';
import { useFinance, type Category, type QuickTransaction, type TransactionType } from '@/context/FinanceContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface TransactionModalProps {
  visible: boolean;
  defaultType: TransactionType;
  defaultAccountId?: string;
  prefillQuick?: Partial<QuickTransaction> | null;
  onClose: () => void;
}

// Etiquetas de tipo de cuenta
const ACCOUNT_TYPE_LABELS: Record<string, string> = { cash: 'Efectivo', debit: 'Débito', credit: 'Crédito' };

export default function TransactionModal({ visible, defaultType, defaultAccountId, prefillQuick, onClose }: TransactionModalProps) {
  const scheme = useColorScheme();
  const C = Colors[scheme];
  const { categories, accounts, addTransaction, quickTransactions } = useFinance();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(defaultAccountId ?? accounts[0]?.id);
  const [note, setNote] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);

  // Sugerencias de descripción: nombres de accesos recurrentes del mismo tipo + categórias
  const suggestions = [
    ...quickTransactions.filter((q) => q.type === type).map((q) => q.name),
    ...categories.filter((c) => c.type === type).map((c) => c.name),
  ].filter((s, i, arr) => arr.indexOf(s) === i); // unique

  useEffect(() => {
    if (visible && prefillQuick) {
      setType(prefillQuick.type ?? defaultType);
      setDescription(prefillQuick.name ?? '');
      setAmount(prefillQuick.amount?.toString() ?? '');
      setNote(prefillQuick.note ?? '');
      const cat = prefillQuick.categoryId
        ? categories.find((c) => c.id === prefillQuick.categoryId) ?? null
        : null;
      setSelectedCategory(cat);
    } else if (visible && !prefillQuick) {
      setType(defaultType);
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setNote('');
      setShowSuggestions(false);
    }
  }, [visible, prefillQuick, defaultType, categories]);

  // Actualizar cuenta por defecto cuando cambia
  useEffect(() => {
    if (defaultAccountId) setSelectedAccountId(defaultAccountId);
    else if (accounts.length > 0 && !selectedAccountId) setSelectedAccountId(accounts[0].id);
  }, [defaultAccountId, accounts]);

  const handleSave = useCallback(() => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Categoría requerida', 'Selecciona una categoría');
      return;
    }
    // Descripción: si está vacía usa el nombre de la categoría
    const finalDesc = description.trim() || selectedCategory.name;

    addTransaction({
      type,
      amount: parsedAmount,
      description: finalDesc,
      categoryId: selectedCategory.id,
      accountId: selectedAccountId,
      note: note.trim() || undefined,
    });
    onClose();
  }, [amount, description, selectedCategory, selectedAccountId, note, type, addTransaction, onClose]);

  const accentColor = type === 'income' ? C.income : C.expense;
  const s = styles(C, scheme);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* ── Tipo ── */}
          <View style={s.typeRow}>
            {(['income', 'expense'] as TransactionType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.typeBtn, type === t && { backgroundColor: t === 'income' ? C.income : C.expense }]}
                onPress={() => { setType(t); setSelectedCategory(null); }}
              >
                <Ionicons
                  name={t === 'income' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                  size={18}
                  color={type === t ? '#fff' : C.textSecondary}
                />
                <Text style={[s.typeBtnText, type === t && { color: '#fff' }]}>
                  {t === 'income' ? 'Ingreso' : 'Gasto'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── Monto ── */}
            <View style={s.amountRow}>
              <Text style={[s.currencySign, { color: accentColor }]}>$</Text>
              <TextInput
                style={[s.amountInput, { color: accentColor }]}
                placeholder="0.00"
                placeholderTextColor={C.textSecondary}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus={!prefillQuick}
              />
            </View>

            {/* ── Descripción (OPCIONAL) ── */}
            <View style={s.fieldRow}>
              <TextInput
                style={[s.input, { color: C.text, flex: 1 }]}
                placeholder="Descripción (opcional)"
                placeholderTextColor={C.textSecondary}
                value={description}
                onChangeText={(v) => { setDescription(v); setShowSuggestions(v.length === 0); }}
                onFocus={() => setShowSuggestions(true)}
              />
              {description.length > 0 && (
                <TouchableOpacity onPress={() => { setDescription(''); setShowSuggestions(true); }} style={s.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={C.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* ── Sugerencias de descripción ── */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={s.suggestionsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
                  {suggestions.slice(0, 10).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[suggestionChipStyle(C), { borderColor: accentColor + '60' }]}
                      onPress={() => { setDescription(s); setShowSuggestions(false); }}
                    >
                      <Text style={{ fontSize: 13, color: C.text, fontWeight: '600' }}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Categorías ── */}
            <Text style={s.label}>Categoría <Text style={s.required}>*</Text></Text>
            <View style={s.catGrid}>
              {filteredCategories.map((cat) => {
                const selected = selectedCategory?.id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.catChip, selected && { backgroundColor: cat.color + '28', borderColor: cat.color, borderWidth: 2 }]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      // Auto-fill description si está vacía
                      if (!description.trim()) setDescription(cat.name);
                      setShowSuggestions(false);
                    }}
                  >
                    <Ionicons name={cat.icon as IoniconName} size={16} color={selected ? cat.color : C.textSecondary} />
                    <Text style={[s.catName, selected && { color: cat.color, fontWeight: '700' }]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Cuenta ── */}
            {accounts.length > 0 && (
              <>
                <Text style={s.label}>Cuenta</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                  {accounts.map((acc) => {
                    const selected = selectedAccountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        style={[s.accountChip, selected && { backgroundColor: acc.color + '28', borderColor: acc.color, borderWidth: 2 }]}
                        onPress={() => setSelectedAccountId(acc.id)}
                      >
                        <Ionicons name={acc.icon as IoniconName} size={18} color={selected ? acc.color : C.textSecondary} />
                        <View>
                          <Text style={[s.accountChipName, selected && { color: acc.color, fontWeight: '700' }]}>{acc.name}</Text>
                          <Text style={s.accountChipType}>{ACCOUNT_TYPE_LABELS[acc.type]}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* ── Nota ── */}
            <TextInput
              style={[s.input, s.noteInput, { color: C.text }]}
              placeholder="Nota (opcional)"
              placeholderTextColor={C.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />

            {/* ── Guardar ── */}
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: accentColor }]} onPress={handleSave}>
              <Text style={s.saveBtnText}>Guardar</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Chip de sugerencia como función separada para evitar crear objetos en el render
function suggestionChipStyle(C: typeof Colors.light) {
  return {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: C.background,
  };
}

const styles = (C: typeof Colors.light, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === 'ios' ? 44 : 28,
      paddingTop: 12, maxHeight: '94%',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 18 },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    typeBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: C.background,
    },
    typeBtnText: { fontSize: 15, fontWeight: '700', color: C.textSecondary },
    amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 12, gap: 2 },
    currencySign: { fontSize: 34, fontWeight: '700', marginBottom: 8 },
    amountInput: { fontSize: 52, fontWeight: '900', minWidth: 120, textAlign: 'center' },
    fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    input: {
      backgroundColor: C.background, borderRadius: 12,
      paddingHorizontal: 16, paddingVertical: 13,
      fontSize: 15, marginBottom: 14,
      borderWidth: 1, borderColor: C.border,
    },
    clearBtn: { padding: 4, marginBottom: 14 },
    noteInput: { height: 72, textAlignVertical: 'top', marginBottom: 14 },
    suggestionsContainer: { marginBottom: 12, marginTop: -4 },
    label: { fontSize: 12, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    required: { color: '#FF6B35', fontWeight: '700' },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    catChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 9,
      borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.background,
    },
    catName: { fontSize: 13, color: C.text, fontWeight: '500' },
    // Cuenta
    accountChip: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.background,
      minWidth: 120,
    },
    accountChipName: { fontSize: 14, fontWeight: '600', color: C.text },
    accountChipType: { fontSize: 11, color: C.textSecondary },
    saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  });
