import { EXPENSE_ICONS, INCOME_ICONS, type IoniconName } from '@/components/CategoryIcon';
import { Colors } from '@/constants/theme';
import {
  useFinance,
  type Account, type AccountType,
  type Category,
  type QuickTransaction,
  type Recurrence,
  type TransactionType,
} from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency, formatRecurrence } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
  ScrollView, StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ──── CONSTANTES ──────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  '#FF6B35', '#FF6B9D', '#C77DFF', '#3483FA', '#4ECDC4',
  '#00A650', '#F5A623', '#FFA000', '#00BCD4', '#E91E63',
  '#9C27B0', '#2196F3', '#4CAF50', '#FF5722', '#607D8B',
  '#795548', '#F44336', '#FF9800', '#009688', '#3F51B5',
];

const ACCOUNT_ICONS: IoniconName[] = [
  'cash', 'card', 'card-outline', 'wallet', 'wallet-outline',
  'briefcase', 'business', 'home', 'storefront',
  'trending-up', 'bar-chart', 'pie-chart', 'phone-portrait', 'laptop', 'globe',
];

const ACCOUNT_TYPE_OPTIONS: { key: AccountType; label: string; desc: string; icon: IoniconName }[] = [
  { key: 'cash', label: 'Efectivo', desc: 'Dinero en mano', icon: 'cash' },
  { key: 'debit', label: 'Débito / Ahorro', desc: 'Cuenta bancaria', icon: 'card-outline' },
  { key: 'credit', label: 'Tarjeta de crédito', desc: 'Con límite y fecha corte', icon: 'card' },
];

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// ──────────────────────────────────────────────────────────────────────────────
// MODAL: CUENTA
// ──────────────────────────────────────────────────────────────────────────────

interface AccountModalProps {
  visible: boolean;
  initial?: Account | null;
  onClose: () => void;
  onSave: (a: Omit<Account, 'id'> & { id?: string }) => void;
}

function AccountModal({ visible, initial, onClose, onSave }: AccountModalProps) {
  const scheme = useColorScheme();
  const C = Colors[scheme];
  const s = sheetStyles(C, scheme);

  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<AccountType>(initial?.type ?? 'cash');
  const [icon, setIcon] = useState<IoniconName>((initial?.icon as IoniconName) ?? 'cash');
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0]);
  const [initialBal, setInitialBal] = useState(initial?.initialBalance?.toString() ?? '');
  const [limit, setLimit] = useState(initial?.limit?.toString() ?? '');
  const [cutoffDay, setCutoffDay] = useState(initial?.cutoffDay?.toString() ?? '');
  const [paymentDay, setPaymentDay] = useState(initial?.paymentDay?.toString() ?? '');

  // Sincroniza los campos cada vez que se abre el modal (edición o creación)
  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setType(initial?.type ?? 'cash');
    setIcon((initial?.icon as IoniconName) ?? 'cash');
    setColor(initial?.color ?? COLOR_OPTIONS[0]);
    setInitialBal(initial?.initialBalance?.toString() ?? '');
    setLimit(initial?.limit?.toString() ?? '');
    setCutoffDay(initial?.cutoffDay?.toString() ?? '');
    setPaymentDay(initial?.paymentDay?.toString() ?? '');
  }, [visible, initial]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Nombre requerido'); return; }
    onSave({
      id: initial?.id, name: name.trim(), type, icon, color,
      initialBalance: initialBal ? parseFloat(initialBal) : 0,
      limit: type === 'credit' && limit ? parseFloat(limit) : undefined,
      cutoffDay: type === 'credit' && cutoffDay ? parseInt(cutoffDay) : undefined,
      paymentDay: type === 'credit' && paymentDay ? parseInt(paymentDay) : undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>{initial ? 'Editar cuenta' : 'Nueva cuenta'}</Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <Text style={s.label}>Tipo de cuenta</Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {ACCOUNT_TYPE_OPTIONS.map(({ key, label, desc, icon: tIcon }) => (
                <TouchableOpacity key={key} style={[s.typeOptionRow, type === key && { backgroundColor: color + '20', borderColor: color }]} onPress={() => { setType(key); setIcon(tIcon); }}>
                  <View style={[s.typeOptionIcon, { backgroundColor: type === key ? color : C.border }]}>
                    <Ionicons name={tIcon} size={20} color={type === key ? '#fff' : C.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.typeOptionLabel, type === key && { color, fontWeight: '800' }]}>{label}</Text>
                    <Text style={s.typeOptionDesc}>{desc}</Text>
                  </View>
                  {type === key && <Ionicons name="checkmark-circle" size={22} color={color} />}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[s.preview, { backgroundColor: color }]}>
              <View style={s.previewIconBg}><Ionicons name={icon} size={24} color={color} /></View>
              <View>
                <Text style={s.previewName}>{name || 'Nombre de cuenta'}</Text>
                <Text style={s.previewSub}>{ACCOUNT_TYPE_OPTIONS.find((o) => o.key === type)?.label}</Text>
              </View>
            </View>

            <TextInput style={[s.input, { color: C.text }]} placeholder="Nombre de la cuenta" placeholderTextColor={C.textSecondary} value={name} onChangeText={setName} />

            {type !== 'credit' && (
              <View style={s.inlineRow}>
                <Text style={s.label}>Saldo inicial</Text>
                <TextInput style={[s.inputSmall, { color: C.text }]} placeholder="$0.00" placeholderTextColor={C.textSecondary} keyboardType="decimal-pad" value={initialBal} onChangeText={setInitialBal} />
              </View>
            )}
            {type === 'credit' && (
              <>
                <View style={s.inlineRow}>
                  <Text style={s.label}>Límite de crédito</Text>
                  <TextInput style={[s.inputSmall, { color: C.text }]} placeholder="$0.00" placeholderTextColor={C.textSecondary} keyboardType="decimal-pad" value={limit} onChangeText={setLimit} />
                </View>
                <View style={s.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>Día de corte</Text>
                    <TextInput style={[s.input, { color: C.text }]} placeholder="Ej. 15" placeholderTextColor={C.textSecondary} keyboardType="number-pad" value={cutoffDay} onChangeText={setCutoffDay} maxLength={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>Día de pago</Text>
                    <TextInput style={[s.input, { color: C.text }]} placeholder="Ej. 5" placeholderTextColor={C.textSecondary} keyboardType="number-pad" value={paymentDay} onChangeText={setPaymentDay} maxLength={2} />
                  </View>
                </View>
              </>
            )}

            <Text style={s.label}>Ícono</Text>
            <View style={s.iconGrid}>
              {ACCOUNT_ICONS.map((n) => {
                const sel = icon === n;
                return (
                  <TouchableOpacity key={n} style={[s.iconItem, sel && { backgroundColor: color + '30', borderColor: color }]} onPress={() => setIcon(n)}>
                    <Ionicons name={n} size={22} color={sel ? color : C.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.label}>Color</Text>
            <View style={s.colorGrid}>
              {COLOR_OPTIONS.map((col) => (
                <TouchableOpacity key={col} style={[s.colorDot, { backgroundColor: col }, color === col && s.colorSelected]} onPress={() => setColor(col)}>
                  {color === col && <Ionicons name="checkmark" size={18} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[s.saveBtn, { backgroundColor: color }]} onPress={handleSave}>
              <Text style={s.saveBtnText}>Guardar cuenta</Text>
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MODAL: CATEGORÍA
// ──────────────────────────────────────────────────────────────────────────────

interface CategoryModalProps {
  visible: boolean;
  initial?: Category | null;
  defaultType?: TransactionType;
  onClose: () => void;
  onSave: (c: Omit<Category, 'id'> & { id?: string }) => void;
}

function CategoryModal({ visible, initial, defaultType = 'expense', onClose, onSave }: CategoryModalProps) {
  const scheme = useColorScheme();
  const C = Colors[scheme];
  const s = sheetStyles(C, scheme);

  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState<IoniconName>((initial?.icon as IoniconName) ?? 'flag');
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0]);
  const [type, setType] = useState<TransactionType>(initial?.type ?? defaultType);
  const [budget, setBudget] = useState(initial?.budget?.toString() ?? '');

  // Sincroniza al abrir
  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setIcon((initial?.icon as IoniconName) ?? 'flag');
    setColor(initial?.color ?? COLOR_OPTIONS[0]);
    setType(initial?.type ?? defaultType);
    setBudget(initial?.budget?.toString() ?? '');
  }, [visible, initial]);

  const icons = type === 'income' ? INCOME_ICONS : EXPENSE_ICONS;

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Nombre requerido'); return; }
    onSave({ id: initial?.id, name: name.trim(), icon, color, type, budget: budget ? parseFloat(budget) : undefined });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>{initial ? 'Editar categoría' : 'Nueva categoría'}</Text>
          <View style={s.typeRow}>
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <TouchableOpacity key={t} style={[s.typeBtn, type === t && { backgroundColor: t === 'income' ? C.income : C.expense }]} onPress={() => { setType(t); setIcon(t === 'income' ? 'briefcase' : 'flag'); }}>
                <Text style={[s.typeBtnText, type === t && { color: '#fff' }]}>{t === 'income' ? '+ Ingreso' : '− Gasto'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={[s.preview, { backgroundColor: color }]}>
              <View style={s.previewIconBg}><Ionicons name={icon} size={24} color={color} /></View>
              <Text style={s.previewName}>{name || 'Categoría'}</Text>
            </View>
            <TextInput style={[s.input, { color: C.text }]} placeholder="Nombre" placeholderTextColor={C.textSecondary} value={name} onChangeText={setName} />
            <View style={s.inlineRow}>
              <Text style={s.label}>Presupuesto mensual</Text>
              <TextInput style={[s.inputSmall, { color: C.text }]} placeholder="Opcional" placeholderTextColor={C.textSecondary} keyboardType="decimal-pad" value={budget} onChangeText={setBudget} />
            </View>
            <Text style={s.label}>Ícono</Text>
            <View style={s.iconGrid}>
              {icons.map(({ name: n, label }) => {
                const sel = icon === n;
                return (
                  <TouchableOpacity key={n} style={[s.iconItem, { width: 68 }, sel && { backgroundColor: color + '30', borderColor: color }]} onPress={() => setIcon(n)}>
                    <Ionicons name={n} size={20} color={sel ? color : C.textSecondary} />
                    <Text style={[{ fontSize: 9, color: C.textSecondary, textAlign: 'center' }, sel && { color, fontWeight: '700' }]} numberOfLines={1}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={s.label}>Color</Text>
            <View style={s.colorGrid}>
              {COLOR_OPTIONS.map((col) => (
                <TouchableOpacity key={col} style={[s.colorDot, { backgroundColor: col }, color === col && s.colorSelected]} onPress={() => setColor(col)}>
                  {color === col && <Ionicons name="checkmark" size={18} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: color }]} onPress={handleSave}>
              <Text style={s.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MODAL: ACCESO RÁPIDO (con recurrencia)
// ──────────────────────────────────────────────────────────────────────────────

interface QuickModalProps {
  visible: boolean;
  initial?: QuickTransaction | null;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSave: (q: Omit<QuickTransaction, 'id'> & { id?: string }) => void;
}

function QuickModal({ visible, initial, categories, accounts, onClose, onSave }: QuickModalProps) {
  const scheme = useColorScheme();
  const C = Colors[scheme];
  const s = sheetStyles(C, scheme);

  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState<IoniconName>((initial?.icon as IoniconName) ?? 'flag');
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [catId, setCatId] = useState(initial?.categoryId ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [isFavorite, setIsFavorite] = useState(!!initial?.favorite);
  const [defaultAccId, setDefaultAccId] = useState<string | undefined>(initial?.defaultAccountId);

  // Recurrencia
  const [isRecurring, setIsRecurring] = useState(!!initial?.recurrence);
  const [frequency, setFrequency] = useState<Recurrence['frequency']>(initial?.recurrence?.frequency ?? 'monthly');
  const [dayOfMonth, setDayOfMonth] = useState(initial?.recurrence?.dayOfMonth?.toString() ?? '1');
  const [dayOfWeek, setDayOfWeek] = useState(initial?.recurrence?.dayOfWeek ?? 1);

  // Sincroniza todos los campos cuando el modal se abre (clave para edición)
  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setIcon((initial?.icon as IoniconName) ?? 'flag');
    setType(initial?.type ?? 'expense');
    setAmount(initial?.amount?.toString() ?? '');
    setCatId(initial?.categoryId ?? '');
    setNote(initial?.note ?? '');
    setIsFavorite(!!initial?.favorite);
    setDefaultAccId(initial?.defaultAccountId);
    setIsRecurring(!!initial?.recurrence);
    setFrequency(initial?.recurrence?.frequency ?? 'monthly');
    setDayOfMonth(initial?.recurrence?.dayOfMonth?.toString() ?? '1');
    setDayOfWeek(initial?.recurrence?.dayOfWeek ?? 1);
  }, [visible, initial]);

  const filteredCats = categories.filter((c) => c.type === type);
  const selectedCat = categories.find((c) => c.id === catId);
  const accent = selectedCat?.color ?? C.tint;
  const icons = type === 'income' ? INCOME_ICONS : EXPENSE_ICONS;

  const recurrenceObj: Recurrence | undefined = isRecurring
    ? { frequency, dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) || 1 : undefined, dayOfWeek: (frequency === 'weekly' || frequency === 'biweekly') ? dayOfWeek : undefined }
    : undefined;

  const previewLabel = recurrenceObj ? formatRecurrence(recurrenceObj) : '';

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Nombre requerido'); return; }
    if (!catId) { Alert.alert('Categoría requerida'); return; }
    onSave({
      id: initial?.id, name: name.trim(), icon, type,
      amount: amount ? parseFloat(amount) : undefined,
      categoryId: catId,
      note: note.trim() || undefined,
      recurrence: recurrenceObj,
      lastAutoExec: initial?.lastAutoExec, // conservar si existe
      lastUsed: initial?.lastUsed,         // conservar si existe
      favorite: isFavorite,
      defaultAccountId: defaultAccId,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <View style={s.handle} />
          {/* Título + estrella favorito */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={s.sheetTitle}>{initial ? 'Editar acceso rápido' : 'Nuevo acceso rápido'}</Text>
            <TouchableOpacity
              onPress={() => setIsFavorite((f) => !f)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: isFavorite ? '#FFB80018' : C.border + '40' }}
            >
              <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={16} color={isFavorite ? '#FFB800' : C.textSecondary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: isFavorite ? '#FFB800' : C.textSecondary }}>
                {isFavorite ? 'Favorito' : 'Favorito'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={s.typeRow}>
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <TouchableOpacity key={t} style={[s.typeBtn, type === t && { backgroundColor: t === 'income' ? C.income : C.expense }]} onPress={() => { setType(t); setCatId(''); setIcon(t === 'income' ? 'briefcase' : 'flag'); }}>
                <Text style={[s.typeBtnText, type === t && { color: '#fff' }]}>{t === 'income' ? '+ Ingreso' : '− Gasto'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Preview */}
            <View style={[s.preview, { backgroundColor: accent }]}>
              <View style={s.previewIconBg}><Ionicons name={icon} size={24} color={accent} /></View>
              <View>
                <Text style={s.previewName}>{name || 'Nombre'}</Text>
                <Text style={s.previewSub}>
                  {amount ? `${type === 'expense' ? '−' : '+'}$${amount}` : 'Monto libre'}
                  {previewLabel ? `  ·  ${previewLabel}` : ''}
                </Text>
              </View>
            </View>

            <TextInput style={[s.input, { color: C.text }]} placeholder="Nombre (ej. Netflix, Salario)" placeholderTextColor={C.textSecondary} value={name} onChangeText={setName} />
            <View style={s.inlineRow}>
              <Text style={s.label}>Monto fijo</Text>
              <TextInput style={[s.inputSmall, { color: C.text }]} placeholder="Deja vacío = libre" placeholderTextColor={C.textSecondary} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            </View>
            <TextInput style={[s.input, { color: C.text }]} placeholder="Nota (opcional)" placeholderTextColor={C.textSecondary} value={note} onChangeText={setNote} />

            {/* ── RECURRENCIA ── */}
            <View style={[s.recurringBox, { borderColor: isRecurring ? accent : C.border }]}>
              <View style={s.recurringHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.recurringTitle, isRecurring && { color: accent }]}>
                    <Ionicons name="repeat" size={15} color={isRecurring ? accent : C.textSecondary} />  Recurrente
                  </Text>
                  <Text style={s.recurringDesc}>Se registra solo automáticamente</Text>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: C.border, true: accent + '60' }}
                  thumbColor={isRecurring ? accent : C.textSecondary}
                />
              </View>

              {isRecurring && (
                <>
                  {/* Frecuencia */}
                  <Text style={[s.label, { marginTop: 12 }]}>Frecuencia</Text>
                  <View style={s.freqRow}>
                    {(['monthly', 'weekly', 'biweekly', 'daily'] as Recurrence['frequency'][]).map((f) => {
                      const labels: Record<string, string> = { monthly: 'Mensual', weekly: 'Semanal', biweekly: 'Quincenal', daily: 'Diario' };
                      const sel = frequency === f;
                      return (
                        <TouchableOpacity key={f} style={[s.freqBtn, sel && { backgroundColor: accent, borderColor: accent }]} onPress={() => setFrequency(f)}>
                          <Text style={[s.freqBtnText, sel && { color: '#fff' }]}>{labels[f]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Día del mes */}
                  {frequency === 'monthly' && (
                    <View style={s.inlineRow}>
                      <Text style={s.label}>Día del mes (1-28)</Text>
                      <TextInput
                        style={[s.inputSmall, { color: C.text, borderColor: accent }]}
                        placeholder="1"
                        placeholderTextColor={C.textSecondary}
                        keyboardType="number-pad"
                        value={dayOfMonth}
                        onChangeText={(v) => { const n = parseInt(v); if (!v || (n >= 1 && n <= 28)) setDayOfMonth(v); }}
                        maxLength={2}
                      />
                    </View>
                  )}

                  {/* Día de la semana */}
                  {(frequency === 'weekly' || frequency === 'biweekly') && (
                    <>
                      <Text style={s.label}>Día de la semana</Text>
                      <View style={s.weekRow}>
                        {DAY_LABELS.map((d, i) => {
                          const sel = dayOfWeek === i;
                          return (
                            <TouchableOpacity key={i} style={[s.weekBtn, sel && { backgroundColor: accent }]} onPress={() => setDayOfWeek(i)}>
                              <Text style={[s.weekBtnText, sel && { color: '#fff' }]}>{d}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {/* Preview de la recurrencia */}
                  {previewLabel ? (
                    <View style={[s.previewRecurring, { backgroundColor: accent + '18' }]}>
                      <Ionicons name="repeat" size={14} color={accent} />
                      <Text style={[s.previewRecurringText, { color: accent }]}>{previewLabel}</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>

            {/* Categoría */}
            <Text style={s.label}>Categoría</Text>
            <View style={s.catChipsRow}>
              {filteredCats.map((cat) => {
                const sel = catId === cat.id;
                return (
                  <TouchableOpacity key={cat.id} style={[s.catChip, sel && { backgroundColor: cat.color + '28', borderColor: cat.color }]} onPress={() => setCatId(cat.id)}>
                    <Ionicons name={cat.icon as IoniconName} size={15} color={sel ? cat.color : C.textSecondary} />
                    <Text style={[s.catChipText, sel && { color: cat.color, fontWeight: '700' }]}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Ícono */}
            <Text style={s.label}>Ícono</Text>
            <View style={s.iconGrid}>
              {icons.map(({ name: n, label }) => {
                const sel = icon === n;
                return (
                  <TouchableOpacity key={n} style={[s.iconItem, sel && { backgroundColor: accent + '30', borderColor: accent }]} onPress={() => setIcon(n)}>
                    <Ionicons name={n} size={22} color={sel ? accent : C.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cuenta por defecto */}
            {accounts.length > 0 && (
              <>
                <Text style={s.label}>Cuenta por defecto</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                  {/* Opción: Sin preferencia */}
                  <TouchableOpacity
                    onPress={() => setDefaultAccId(undefined)}
                    style={[
                      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.background, minWidth: 90 },
                      !defaultAccId && { borderColor: C.textSecondary, borderWidth: 2 },
                    ]}
                  >
                    <Ionicons name="close-circle-outline" size={16} color={!defaultAccId ? C.text : C.textSecondary} />
                    <Text style={{ fontSize: 13, fontWeight: !defaultAccId ? '700' : '500', color: !defaultAccId ? C.text : C.textSecondary }}>Sin preferencia</Text>
                  </TouchableOpacity>

                  {accounts.map((acc) => {
                    const selected = defaultAccId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => setDefaultAccId(acc.id)}
                        style={[
                          { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.background, minWidth: 100 },
                          selected && { backgroundColor: acc.color + '22', borderColor: acc.color, borderWidth: 2 },
                        ]}
                      >
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: acc.color }} />
                        <Text style={{ fontSize: 13, fontWeight: selected ? '700' : '500', color: selected ? acc.color : C.text }} numberOfLines={1}>{acc.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <TouchableOpacity style={[s.saveBtn, { backgroundColor: accent }]} onPress={handleSave}>
              <Text style={s.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PANTALLA CONFIGURACIÓN
// ──────────────────────────────────────────────────────────────────────────────

type TabKey = 'accounts' | 'quick' | 'categories' | 'stats';

export default function SettingsScreen() {
  const { scheme, toggleScheme } = useTheme();  // ← toggle correcto
  const C = Colors[scheme];
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();

  const {
    categories, transactions, quickTransactions, accounts,
    totalExpense, getAccountBalance, getAccountExpense,
    addCategory, updateCategory, deleteCategory,
    addQuickTransaction, updateQuickTransaction, deleteQuickTransaction,
    addAccount, updateAccount, deleteAccount,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<TabKey>('accounts');
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [newCatType, setNewCatType] = useState<TransactionType>('expense');
  const [quickModal, setQuickModal] = useState(false);
  const [editQuick, setEditQuick] = useState<QuickTransaction | null>(null);
  const [accModal, setAccModal] = useState(false);
  const [editAcc, setEditAcc] = useState<Account | null>(null);

  const expenseSummary = categories
    .filter((c) => c.type === 'expense')
    .map((cat) => ({ cat, total: transactions.filter((t) => t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  const handleSaveCat = useCallback((c: Omit<Category, 'id'> & { id?: string }) => { c.id ? updateCategory(c as Category) : addCategory(c); }, [addCategory, updateCategory]);
  const handleSaveQuick = useCallback((q: Omit<QuickTransaction, 'id'> & { id?: string }) => { q.id ? updateQuickTransaction(q as QuickTransaction) : addQuickTransaction(q); }, [addQuickTransaction, updateQuickTransaction]);
  const handleSaveAcc = useCallback((a: Omit<Account, 'id'> & { id?: string }) => { a.id ? updateAccount(a as Account) : addAccount(a); }, [addAccount, updateAccount]);

  const handleDeleteCat = (cat: Category) => Alert.alert('Eliminar', `¿Eliminar "${cat.name}"?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => deleteCategory(cat.id) }]);
  const handleDeleteQuick = (q: QuickTransaction) => Alert.alert('Eliminar', `¿Eliminar "${q.name}"?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => deleteQuickTransaction(q.id) }]);
  const handleDeleteAcc = (a: Account) => Alert.alert('Eliminar cuenta', `¿Eliminar "${a.name}"? Los movimientos no se borran.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => deleteAccount(a.id) }]);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 20);
  const TAB_BAR_H = Platform.OS === 'ios' ? 80 : 64;
  const tabPad = TAB_BAR_H + 16;
  const s = styles(C, isDark, topPad);

  const TABS: { key: TabKey; label: string; icon: IoniconName }[] = [
    { key: 'accounts', label: 'Cuentas', icon: 'card' },
    { key: 'quick', label: 'Recurrentes', icon: 'flash' },
    { key: 'categories', label: 'Categorías', icon: 'pricetag' },
    { key: 'stats', label: 'Stats', icon: 'bar-chart' },
  ];

  return (
    <View style={s.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>Configuración</Text>
            <Text style={s.headerSub}>Personaliza tu experiencia</Text>
          </View>
          {/* ── Toggle dark/light ── */}
          <TouchableOpacity style={s.modeBtn} onPress={toggleScheme} activeOpacity={0.8}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={isDark ? '#FFC947' : '#5B5EA6'} />
            <Text style={[s.modeBtnText, { color: isDark ? '#FFC947' : '#5B5EA6' }]}>{isDark ? 'Claro' : 'Oscuro'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab.key} style={[s.tab, activeTab === tab.key && s.tabActive]} onPress={() => setActiveTab(tab.key)}>
              <Ionicons name={tab.icon} size={15} color={activeTab === tab.key ? C.tint : C.textSecondary} />
              <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabPad }}>

        {/* ━━━ CUENTAS ━━━ */}
        {activeTab === 'accounts' && (
          <View style={s.section}>
            <View style={s.sectionRow}>
              <View>
                <Text style={s.sectionTitle}>Mis cuentas</Text>
                <Text style={s.sectionSub}>Efectivo, débito y tarjetas de crédito</Text>
              </View>
              <TouchableOpacity style={s.addBtn} onPress={() => { setEditAcc(null); setAccModal(true); }}>
                <Ionicons name="add" size={16} color="#fff" /><Text style={s.addBtnText}>Nueva</Text>
              </TouchableOpacity>
            </View>

            {accounts.length === 0 ? (
              <View style={[s.card, { padding: 28, alignItems: 'center' }]}>
                <Ionicons name="card-outline" size={44} color={C.textSecondary} />
                <Text style={[s.sectionSub, { textAlign: 'center', marginTop: 8 }]}>Agrega tu primera cuenta</Text>
              </View>
            ) : (
              <View style={s.card}>
                {accounts.map((acc, i) => {
                  const isCredit = acc.type === 'credit';
                  const balance = getAccountBalance(acc.id);
                  const spent = getAccountExpense(acc.id);
                  const limitPct = isCredit && acc.limit ? Math.min(spent / acc.limit, 1) : 0;
                  const overLimit = isCredit && acc.limit && spent > acc.limit;
                  return (
                    <View key={acc.id} style={[{ padding: 16 }, i < accounts.length - 1 && s.rowBorder]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[s.iconBg, { backgroundColor: acc.color + '20' }]}>
                          <Ionicons name={acc.icon as IoniconName} size={22} color={acc.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.rowTitle}>{acc.name}</Text>
                          <Text style={s.rowSub}>{acc.type === 'cash' ? 'Efectivo' : acc.type === 'debit' ? 'Débito / Ahorro' : 'Crédito'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', marginRight: 6 }}>
                          <Text style={[s.rowTitle, { color: isCredit ? (overLimit ? C.expense : C.tint) : balance < 0 ? C.expense : C.income }]}>
                            {isCredit ? formatCurrency(spent) : formatCurrency(Math.abs(balance))}
                          </Text>
                          <Text style={s.rowSub}>{isCredit ? (acc.limit ? `de ${formatCurrency(acc.limit)}` : 'gastado') : 'disponible'}</Text>
                        </View>
                        <TouchableOpacity style={s.editBtn} onPress={() => { setEditAcc(acc); setAccModal(true); }}>
                          <Text style={[s.editBtnText, { color: C.tint }]}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteAcc(acc)} style={{ padding: 6 }}>
                          <Ionicons name="trash-outline" size={18} color={C.expense} />
                        </TouchableOpacity>
                      </View>
                      {isCredit && acc.limit && (
                        <View style={[s.progressBg, { marginTop: 10 }]}>
                          <View style={[s.progressFill, { width: `${limitPct * 100}%` as any, backgroundColor: overLimit ? C.expense : acc.color }]} />
                        </View>
                      )}
                      {(acc.cutoffDay || acc.paymentDay) && (
                        <Text style={[s.rowSub, { marginTop: 6 }]}>
                          {acc.cutoffDay ? `Corte día ${acc.cutoffDay}` : ''}
                          {acc.cutoffDay && acc.paymentDay ? '  ·  ' : ''}
                          {acc.paymentDay ? `Pago día ${acc.paymentDay}` : ''}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ━━━ RECURRENTES ━━━ */}
        {activeTab === 'quick' && (
          <View style={s.section}>
            <View style={s.sectionRow}>
              <View>
                <Text style={s.sectionTitle}>Accesos recurrentes</Text>
                <Text style={s.sectionSub}>Toca en inicio para registrar al instante</Text>
              </View>
              <TouchableOpacity style={s.addBtn} onPress={() => { setEditQuick(null); setQuickModal(true); }}>
                <Ionicons name="add" size={16} color="#fff" /><Text style={s.addBtnText}>Nuevo</Text>
              </TouchableOpacity>
            </View>
            {quickTransactions.length === 0 ? (
              <View style={[s.card, { padding: 28, alignItems: 'center' }]}>
                <Ionicons name="flash-outline" size={44} color={C.textSecondary} />
                <Text style={[s.sectionSub, { textAlign: 'center', marginTop: 8 }]}>Crea accesos para Netflix, café, etc.</Text>
              </View>
            ) : (
              <View style={s.card}>
                {quickTransactions.map((q, i) => {
                  const cat = categories.find((c) => c.id === q.categoryId);
                  const clr = cat?.color ?? C.tint;
                  return (
                    <View key={q.id} style={[s.row, i < quickTransactions.length - 1 && s.rowBorder]}>
                      <View style={[s.iconBg, { backgroundColor: clr + '20' }]}>
                        <Ionicons name={q.icon as IoniconName} size={22} color={clr} />
                      </View>
                      <View style={s.rowInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={s.rowTitle}>{q.name}</Text>
                          {q.favorite && <Ionicons name="star" size={11} color="#FFB800" />}
                        </View>
                        <Text style={s.rowSub}>
                          {cat?.name ?? '–'}
                          {q.amount ? `  ·  ${q.type === 'expense' ? '−' : '+'}${formatCurrency(q.amount)}` : '  ·  Monto libre'}
                          {q.recurrence ? `  ·  ${formatRecurrence(q.recurrence)}` : ''}
                          {q.defaultAccountId ? `  ·  ${accounts.find(a => a.id === q.defaultAccountId)?.name ?? ''}` : ''}
                        </Text>
                      </View>
                      {q.recurrence && <Ionicons name="repeat" size={14} color={C.tint} style={{ marginHorizontal: 4 }} />}
                      {/* Estrella favorito sin abrir modal */}
                      <TouchableOpacity
                        onPress={() => updateQuickTransaction({ ...q, favorite: !q.favorite })}
                        style={{ padding: 6 }}
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                      >
                        <Ionicons
                          name={q.favorite ? 'star' : 'star-outline'}
                          size={18}
                          color={q.favorite ? '#FFB800' : C.border}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity style={s.editBtn} onPress={() => { setEditQuick(q); setQuickModal(true); }}>
                        <Text style={[s.editBtnText, { color: C.tint }]}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteQuick(q)} style={{ padding: 6 }}>
                        <Ionicons name="trash-outline" size={18} color={C.expense} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ━━━ CATEGORÍAS ━━━ */}
        {activeTab === 'categories' && (
          <View style={s.section}>
            {(['expense', 'income'] as const).map((type) => {
              const cats = categories.filter((c) => c.type === type);
              return (
                <View key={type} style={{ marginBottom: 20 }}>
                  <View style={s.sectionRow}>
                    <Text style={s.sectionTitle}>{type === 'expense' ? 'Gastos' : 'Ingresos'}</Text>
                    <TouchableOpacity style={s.addBtn} onPress={() => { setEditCat(null); setNewCatType(type); setCatModal(true); }}>
                      <Ionicons name="add" size={16} color="#fff" /><Text style={s.addBtnText}>Nueva</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.card}>
                    {cats.map((cat, i) => (
                      <View key={cat.id} style={[s.row, i < cats.length - 1 && s.rowBorder]}>
                        <View style={[s.iconBg, { backgroundColor: cat.color + '20' }]}>
                          <Ionicons name={cat.icon as IoniconName} size={22} color={cat.color} />
                        </View>
                        <View style={s.rowInfo}>
                          <Text style={s.rowTitle}>{cat.name}</Text>
                          {cat.budget && <Text style={s.rowSub}>Presupuesto: {formatCurrency(cat.budget)}/mes</Text>}
                        </View>
                        <TouchableOpacity style={s.editBtn} onPress={() => { setEditCat(cat); setCatModal(true); }}>
                          <Text style={[s.editBtnText, { color: C.tint }]}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteCat(cat)} style={{ padding: 6 }}>
                          <Ionicons name="trash-outline" size={18} color={C.expense} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ━━━ STATS ━━━ */}
        {activeTab === 'stats' && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { marginBottom: 12 }]}>Gasto por categoría</Text>
            {expenseSummary.length === 0 ? (
              <View style={[s.card, { padding: 28, alignItems: 'center' }]}>
                <Ionicons name="bar-chart-outline" size={44} color={C.textSecondary} />
                <Text style={[s.sectionSub, { textAlign: 'center', marginTop: 8 }]}>Aún no hay gastos registrados.</Text>
              </View>
            ) : (
              <View style={s.card}>
                {expenseSummary.map(({ cat, total }, i) => {
                  const pct = totalExpense > 0 ? total / totalExpense : 0;
                  const over = cat.budget && total > cat.budget;
                  return (
                    <View key={cat.id} style={[{ paddingHorizontal: 16, paddingVertical: 14, gap: 8 }, i < expenseSummary.length - 1 && s.rowBorder]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[s.iconBg, { backgroundColor: cat.color + '20' }]}>
                          <Ionicons name={cat.icon as IoniconName} size={20} color={cat.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.rowTitle}>{cat.name}</Text>
                          {cat.budget && <Text style={[s.rowSub, over ? { color: C.expense } : {}]}>{over ? '⚠ Sobre límite  ·  ' : ''}Límite: {formatCurrency(cat.budget)}</Text>}
                        </View>
                        <Text style={[s.rowTitle, { color: C.expense }]}>{formatCurrency(total)}</Text>
                      </View>
                      <View style={s.progressBg}>
                        <View style={[s.progressFill, { width: `${Math.min(pct * 100, 100)}%` as any, backgroundColor: over ? C.expense : cat.color }]} />
                      </View>
                      <Text style={s.rowSub}>{Math.round(pct * 100)}% del total</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <AccountModal visible={accModal} initial={editAcc} onClose={() => { setAccModal(false); setEditAcc(null); }} onSave={handleSaveAcc} />
      <CategoryModal visible={catModal} initial={editCat} defaultType={newCatType} onClose={() => { setCatModal(false); setEditCat(null); }} onSave={handleSaveCat} />
      <QuickModal visible={quickModal} initial={editQuick} categories={categories} accounts={accounts} onClose={() => { setQuickModal(false); setEditQuick(null); }} onSave={handleSaveQuick} />
    </View>
  );
}

// ──── ESTILOS PANTALLA ────────────────────────────────────────────────────────

const styles = (C: typeof Colors.light, isDark: boolean, topPad: number) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { backgroundColor: C.card, paddingTop: topPad + 8, paddingHorizontal: 20, paddingBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 8, elevation: 4 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: C.text },
    headerSub: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
    modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,201,71,0.12)' : 'rgba(91,94,166,0.10)' },
    modeBtnText: { fontSize: 13, fontWeight: '700' },
    tabRow: { gap: 6 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.background },
    tabActive: { backgroundColor: isDark ? '#2A2A2A' : '#EEF2FF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
    tabTextActive: { color: C.tint, fontWeight: '800' },
    section: { marginHorizontal: 16, marginTop: 20 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text },
    sectionSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    addBtn: { backgroundColor: C.tint, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    card: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.25 : 0.06, shadowRadius: 8, elevation: 3 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    iconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    rowInfo: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: C.text },
    rowSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    editBtn: { backgroundColor: isDark ? '#1E2D45' : '#EBF3FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    editBtnText: { fontSize: 12, fontWeight: '600' },
    progressBg: { height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
  });

// ──── ESTILOS MODALES ────────────────────────────────────────────────────────

const sheetStyles = (C: typeof Colors.light, scheme: 'light' | 'dark') =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 44 : 28, paddingTop: 12, maxHeight: '94%' },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 16 },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    typeBtnText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
    typeOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.background },
    typeOptionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    typeOptionLabel: { fontSize: 15, fontWeight: '600', color: C.text },
    typeOptionDesc: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    preview: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, marginBottom: 14 },
    previewIconBg: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
    previewName: { fontSize: 18, fontWeight: '800', color: '#fff' },
    previewSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    input: { backgroundColor: C.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: C.border },
    inputSmall: { backgroundColor: C.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1, borderColor: C.border, minWidth: 130, textAlign: 'right' },
    inlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    twoColRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    label: { fontSize: 12, fontWeight: '700', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    iconItem: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.background },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    colorSelected: { borderWidth: 3, borderColor: '#fff', elevation: 4 },
    catChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.background },
    catChipText: { fontSize: 13, color: C.text, fontWeight: '500' },
    saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    // Recurrencia
    recurringBox: { borderRadius: 16, borderWidth: 1.5, padding: 14, backgroundColor: C.background, marginBottom: 16 },
    recurringHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    recurringTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
    recurringDesc: { fontSize: 12, color: C.textSecondary },
    freqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    freqBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.background },
    freqBtnText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
    weekRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    weekBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.background },
    weekBtnText: { fontSize: 11, fontWeight: '600', color: C.textSecondary },
    previewRecurring: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 10, marginTop: 4 },
    previewRecurringText: { fontSize: 13, fontWeight: '700' },
  });
