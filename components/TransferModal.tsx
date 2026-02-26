import { Colors } from '@/constants/theme';
import { useFinance } from '@/context/FinanceContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency } from '@/utils/format';
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
  View,
} from 'react-native';

interface TransferModalProps {
  visible: boolean;
  defaultFromAccountId?: string;
  onClose: () => void;
}

export default function TransferModal({ visible, defaultFromAccountId, onClose }: TransferModalProps) {
  const scheme = useColorScheme();
  const C = Colors[scheme];
  const s = styles(C);

  const { accounts, addTransfer, getAccountBalance } = useFinance();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [fromId, setFromId] = useState<string>(defaultFromAccountId ?? accounts[0]?.id ?? '');
  const [toId, setToId] = useState<string>('');

  // Al abrir, inicializar cuentas
  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setNote('');
    const first = defaultFromAccountId ?? accounts[0]?.id ?? '';
    setFromId(first);
    const second = accounts.find((a) => a.id !== first)?.id ?? '';
    setToId(second);
  }, [visible, defaultFromAccountId, accounts]);

  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount = accounts.find((a) => a.id === toId);

  const handleSave = useCallback(() => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!parsed || parsed <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0');
      return;
    }
    if (!fromId || !toId) {
      Alert.alert('Selecciona cuentas', 'Elige una cuenta origen y una destino');
      return;
    }
    if (fromId === toId) {
      Alert.alert('Cuentas iguales', 'La cuenta origen y destino deben ser diferentes');
      return;
    }
    addTransfer(parsed, fromId, toId, note.trim() || undefined);
    onClose();
  }, [amount, fromId, toId, note, addTransfer, onClose]);

  const swapAccounts = () => {
    setFromId(toId);
    setToId(fromId);
  };

  if (accounts.length < 2) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <View style={{ alignItems: 'center', padding: 32 }}>
              <Ionicons name="swap-horizontal-outline" size={48} color={C.textSecondary} style={{ marginBottom: 16 }} />
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>Necesitas al menos 2 cuentas</Text>
              <Text style={{ color: C.textSecondary, textAlign: 'center', marginTop: 8 }}>Crea otra desde la pestaña Configuración.</Text>
              <TouchableOpacity onPress={onClose} style={[s.saveBtn, { backgroundColor: C.tint, marginTop: 24 }]}>
                <Text style={s.saveBtnText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Título */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.tint + '22', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="swap-horizontal" size={20} color={C.tint} />
            </View>
            <Text style={{ color: C.text, fontSize: 18, fontWeight: '800' }}>Transferencia</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Monto */}
            <View style={s.amountRow}>
              <Text style={[s.currencySign, { color: C.tint }]}>$</Text>
              <TextInput
                style={[s.amountInput, { color: C.tint }]}
                placeholder="0.00"
                placeholderTextColor={C.textSecondary}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            {/* Cuentas origen */}
            <View style={{ marginBottom: 20 }}>
              <Text style={s.label}>Origen</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {accounts.map((acc) => {
                  const selected = fromId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => {
                        setFromId(acc.id);
                        if (toId === acc.id) {
                          const other = accounts.find((a) => a.id !== acc.id);
                          if (other) setToId(other.id);
                        }
                      }}
                      style={[
                        s.accountChip,
                        selected && { backgroundColor: acc.color + '22', borderColor: acc.color, borderWidth: 2 },
                      ]}
                    >
                      <Ionicons name="arrow-up-circle" size={14} color={selected ? acc.color : C.textSecondary} />
                      <Text style={[s.accountChipName, selected && { color: acc.color, fontWeight: '700' }]} numberOfLines={1}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Swap */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
              <TouchableOpacity onPress={swapAccounts} style={s.swapBtn}>
                <Ionicons name="swap-vertical" size={18} color={C.tint} />
              </TouchableOpacity>
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            </View>

            {/* Destino */}
            <View style={{ marginBottom: 20 }}>
              <Text style={s.label}>Destino</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {accounts.map((acc) => {
                  const selected = toId === acc.id;
                  const isFrom = fromId === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      onPress={() => {
                        if (isFrom) return;
                        setToId(acc.id);
                      }}
                      style={[
                        s.accountChip,
                        selected && { backgroundColor: acc.color + '22', borderColor: acc.color, borderWidth: 2 },
                        isFrom && { opacity: 0.35 },
                      ]}
                    >
                      <Ionicons name="arrow-down-circle" size={14} color={selected ? acc.color : C.textSecondary} />
                      <Text style={[s.accountChipName, selected && { color: acc.color, fontWeight: '700' }]} numberOfLines={1}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Resumen visual */}
            {fromAccount && toAccount && fromId !== toId && (
              <View style={s.summaryCard}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={[s.accountDot, { backgroundColor: fromAccount.color }]} />
                  <Text style={s.summaryName}>{fromAccount.name}</Text>
                  <Text style={[s.summaryBalance, { color: C.textSecondary }]}>
                    Disponible: {formatCurrency(getAccountBalance(fromAccount.id))}
                  </Text>
                </View>
                <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
                  <Ionicons name="arrow-forward" size={20} color={C.tint} />
                  {amount ? <Text style={{ color: C.tint, fontWeight: '700', fontSize: 13, marginTop: 2 }}>{formatCurrency(parseFloat(amount) || 0)}</Text> : null}
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={[s.accountDot, { backgroundColor: toAccount.color }]} />
                  <Text style={s.summaryName}>{toAccount.name}</Text>
                  <Text style={[s.summaryBalance, { color: C.textSecondary }]}>
                    Disponible: {formatCurrency(getAccountBalance(toAccount.id))}
                  </Text>
                </View>
              </View>
            )}

            {/* Nota */}
            <TextInput
              style={[s.input, s.noteInput, { color: C.text }]}
              placeholder="Nota (opcional)"
              placeholderTextColor={C.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
            />

            {/* Guardar */}
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.tint }]} onPress={handleSave}>
              <Ionicons name="swap-horizontal" size={18} color="#fff" />
              <Text style={s.saveBtnText}>Transferir</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = (C: typeof Colors.light) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
      backgroundColor: C.card,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === 'ios' ? 44 : 28,
      paddingTop: 12, maxHeight: '92%',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 18 },
    amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 12, gap: 2 },
    currencySign: { fontSize: 34, fontWeight: '700', marginBottom: 8 },
    amountInput: { fontSize: 52, fontWeight: '900', minWidth: 120, textAlign: 'center' },
    label: { fontSize: 12, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    accountChip: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.background,
      minWidth: 110,
    },
    accountChipName: { fontSize: 14, fontWeight: '600', color: C.text },
    swapBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.tint + '18', alignItems: 'center', justifyContent: 'center',
      borderWidth: 1.5, borderColor: C.tint + '44',
    },
    summaryCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: C.background, borderRadius: 16, padding: 16, marginBottom: 16,
      borderWidth: 1, borderColor: C.border,
    },
    accountDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
    summaryName: { color: C.text, fontWeight: '700', fontSize: 13, textAlign: 'center' },
    summaryBalance: { fontSize: 11, marginTop: 2, textAlign: 'center' },
    input: {
      backgroundColor: C.background, borderRadius: 12,
      paddingHorizontal: 16, paddingVertical: 13,
      fontSize: 15, marginBottom: 14,
      borderWidth: 1, borderColor: C.border,
    },
    noteInput: { height: 72, textAlignVertical: 'top' },
    saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
    saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  });
