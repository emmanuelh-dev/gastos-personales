import type { IoniconName } from '@/components/CategoryIcon';
import FinanceChart from '@/components/FinanceChart';
import TransactionModal from '@/components/TransactionModal';
import { Colors } from '@/constants/theme';
import type { QuickTransaction, TransactionType } from '@/context/FinanceContext';
import { useFinance, type Account } from '@/context/FinanceContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatCurrency, formatDate, formatRecurrence } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Platform, StatusBar as RNStatusBar,
  ScrollView, StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_W = Math.min(width * 0.72, 280);

const ACCOUNT_TYPE_ICONS: Record<string, IoniconName> = {
  cash: 'cash-outline',
  debit: 'card-outline',
  credit: 'card',
};

// Navega a Configuración → tab Cuentas o Recurrentes
function goToSettings() {
  router.navigate('/(tabs)/explore');
}

export default function HomeScreen() {
  const scheme = useColorScheme();
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';

  const {
    transactions, quickTransactions, accounts,
    totalBalance, totalIncome, totalExpense,
    getCategoryById, getAccountById, getAccountBalance, getAccountExpense,
    deleteTransaction, addTransaction,
  } = useFinance();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('expense');
  const [prefill, setPrefill] = useState<Partial<QuickTransaction> | null>(null);
  const [defaultAccId, setDefaultAccId] = useState<string | undefined>(undefined);
  const [balanceHidden, setBalanceHidden] = useState(false);

  const openModal = (type: TransactionType, quick?: QuickTransaction, accountId?: string) => {
    setModalType(type);
    setPrefill(quick ?? null);
    setDefaultAccId(accountId);
    setModalVisible(true);
  };

  const handleQuickTap = useCallback(
    (q: QuickTransaction) => {
      if (q.amount) {
        addTransaction({ type: q.type, amount: q.amount, description: q.name, categoryId: q.categoryId, note: q.note });
        if (Platform.OS === 'android') ToastAndroid.show(`${q.name} registrado`, ToastAndroid.SHORT);
      } else {
        openModal(q.type, q);
      }
    },
    [addTransaction]
  );

  const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert('Eliminar', '¿Eliminar este movimiento?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteTransaction(id) },
      ]);
    },
    [deleteTransaction]
  );

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 20);
  const isPositive = totalBalance >= 0;
  const s = styles(C, isDark, topPad);

  const cutoffLabel = (acc: Account) => {
    if (acc.type !== 'credit' || !acc.cutoffDay) return null;
    return `Corte día ${acc.cutoffDay}${acc.paymentDay ? `  ·  Pago día ${acc.paymentDay}` : ''}`;
  };

  return (
    <View style={s.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>Mi Cartera</Text>
          <View style={[s.badge, { backgroundColor: isPositive ? C.income : C.expense }]}>
            <Text style={s.badgeText}>{isPositive ? '▲ Al corriente' : '▼ Negativo'}</Text>
          </View>
        </View>
        <Text style={s.disponibleLabel}>Balance total</Text>
        <TouchableOpacity style={s.balanceRow} onPress={() => setBalanceHidden((h) => !h)} activeOpacity={0.75}>
          {balanceHidden
            ? <Text style={s.balanceHidden}>● ● ● ● ●</Text>
            : <Text style={[s.balanceAmount, { color: isPositive ? C.income : C.expense }]} numberOfLines={1} adjustsFontSizeToFit>
              {totalBalance < 0 ? '−' : ''}{formatCurrency(Math.abs(totalBalance))}
            </Text>
          }
          <Ionicons name={balanceHidden ? 'eye-off-outline' : 'eye-outline'} size={22} color={C.textSecondary} />
        </TouchableOpacity>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Ionicons name="arrow-up-circle" size={18} color={C.income} />
            <View><Text style={s.statLabel}>Ingresos</Text><Text style={[s.statValue, { color: C.income }]}>{formatCurrency(totalIncome)}</Text></View>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Ionicons name="arrow-down-circle" size={18} color={C.expense} />
            <View><Text style={s.statLabel}>Gastos</Text><Text style={[s.statValue, { color: C.expense }]}>{formatCurrency(totalExpense)}</Text></View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── BOTONES PRINCIPALES ── */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.incomeBtn} onPress={() => openModal('income')} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={26} color="#fff" />
            <View><Text style={s.actionLabel}>Agregar</Text><Text style={s.actionSub}>Ingreso</Text></View>
          </TouchableOpacity>
          <TouchableOpacity style={s.expenseBtn} onPress={() => openModal('expense')} activeOpacity={0.85}>
            <Ionicons name="remove-circle-outline" size={26} color="#fff" />
            <View><Text style={s.actionLabel}>Registrar</Text><Text style={s.actionSub}>Gasto</Text></View>
          </TouchableOpacity>
        </View>

        {/* ── GRAFICO ── */}
        <FinanceChart />

        {/* ── TARJETAS DE CUENTAS ── */}
        {accounts.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Mis cuentas</Text>
              {/* Ver todas → navega a Configuración */}
              <TouchableOpacity onPress={goToSettings} style={s.verTodasBtn}>
                <Text style={[s.verTodasText, { color: C.tint }]}>Ver todas</Text>
                <Ionicons name="chevron-forward" size={13} color={C.tint} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.accountsList}>
              {accounts.map((acc) => {
                const balance = getAccountBalance(acc.id);
                const spent = getAccountExpense(acc.id);
                const isCredit = acc.type === 'credit';
                const limitPct = isCredit && acc.limit ? Math.min(spent / acc.limit, 1) : 0;
                const overLimit = isCredit && acc.limit && spent > acc.limit;
                const balColor = isCredit ? (overLimit ? '#FFB3B3' : '#fff') : balance < 0 ? '#FFB3B3' : '#fff';

                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[s.accountCard, { backgroundColor: acc.color }]}
                    onPress={() => openModal('expense', undefined, acc.id)}
                    activeOpacity={0.85}
                  >
                    <View style={s.accountCardTop}>
                      <View style={s.accountIconBg}>
                        <Ionicons name={ACCOUNT_TYPE_ICONS[acc.type]} size={20} color={acc.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.accountCardName}>{acc.name}</Text>
                        <Text style={s.accountCardType}>
                          {acc.type === 'cash' ? 'Efectivo' : acc.type === 'debit' ? 'Débito / Ahorro' : 'Crédito'}
                        </Text>
                      </View>
                    </View>
                    {isCredit ? (
                      <>
                        <Text style={s.accountCardLabel}>Gastado este ciclo</Text>
                        <Text style={[s.accountCardBalance, { color: balColor }]}>
                          {balanceHidden ? '● ● ●' : formatCurrency(spent)}
                        </Text>
                        {acc.limit && (
                          <>
                            <View style={s.limitBar}>
                              <View style={[s.limitFill, { width: `${limitPct * 100}%` as any, backgroundColor: overLimit ? '#FF6B6B' : '#fff' }]} />
                            </View>
                            <Text style={s.limitLabel}>{formatCurrency(spent)} / {formatCurrency(acc.limit)} — {Math.round(limitPct * 100)}%</Text>
                          </>
                        )}
                        {cutoffLabel(acc) && <Text style={s.cutoffLabel}>{cutoffLabel(acc)}</Text>}
                      </>
                    ) : (
                      <>
                        <Text style={s.accountCardLabel}>Disponible</Text>
                        <Text style={[s.accountCardBalance, { color: balColor }]}>
                          {balanceHidden ? '● ● ●' : formatCurrency(Math.abs(balance))}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── ACCESOS RECURRENTES ── */}
        {quickTransactions.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Accesos recurrentes</Text>
              <TouchableOpacity onPress={goToSettings} style={s.verTodasBtn}>
                <Text style={[s.verTodasText, { color: C.tint }]}>Editar</Text>
                <Ionicons name="chevron-forward" size={13} color={C.tint} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickList}>
              {quickTransactions.map((q) => {
                const cat = getCategoryById(q.categoryId);
                const clr = cat?.color ?? (q.type === 'income' ? C.income : C.expense);
                const recLabel = q.recurrence ? formatRecurrence(q.recurrence) : null;
                return (
                  <TouchableOpacity key={q.id} style={s.quickCard} onPress={() => handleQuickTap(q)} activeOpacity={0.75}>
                    <View style={[s.quickIconBg, { backgroundColor: clr + '22' }]}>
                      <Ionicons name={q.icon as IoniconName} size={26} color={clr} />
                    </View>
                    <Text style={s.quickName} numberOfLines={1}>{q.name}</Text>
                    {q.amount
                      ? <Text style={[s.quickAmount, { color: q.type === 'income' ? C.income : C.expense }]}>{q.type === 'expense' ? '−' : '+'}{formatCurrency(q.amount, false)}</Text>
                      : <Text style={s.quickAmountFree}>Libre</Text>
                    }
                    {/* Etiqueta de recurrencia */}
                    {recLabel && (
                      <View style={s.recurrencePill}>
                        <Ionicons name="repeat" size={9} color={clr} />
                        <Text style={[s.recurrencePillText, { color: clr }]} numberOfLines={1}>{recLabel}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── MOVIMIENTOS RECIENTES ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Movimientos recientes</Text>
          {transactions.length > 0 && (
            <View style={s.countBadge}><Text style={s.countText}>{transactions.length}</Text></View>
          )}
        </View>

        {transactions.length === 0 ? (
          <View style={s.emptyState}>
            <View style={[s.emptyIconBg, { backgroundColor: C.border }]}>
              <Ionicons name="wallet-outline" size={48} color={C.textSecondary} />
            </View>
            <Text style={s.emptyTitle}>Sin movimientos</Text>
            <Text style={s.emptyText}>Usa los botones de arriba o un acceso rápido para comenzar.</Text>
          </View>
        ) : (
          <View style={s.txCard}>
            {transactions.slice(0, 50).map((tx, i) => {
              const cat = getCategoryById(tx.categoryId);
              const acc = tx.accountId ? getAccountById(tx.accountId) : undefined;
              const isIncome = tx.type === 'income';
              const clr = cat?.color ?? (isIncome ? C.income : C.expense);
              return (
                <TouchableOpacity
                  key={tx.id}
                  style={[s.txItem, i < transactions.length - 1 && s.txBorder]}
                  onLongPress={() => confirmDelete(tx.id)}
                  activeOpacity={0.7}
                >
                  <View style={[s.txIconBg, { backgroundColor: clr + '20' }]}>
                    <Ionicons name={(cat?.icon as IoniconName) ?? 'cash-outline'} size={22} color={clr} />
                  </View>
                  <View style={s.txInfo}>
                    <Text style={s.txDesc} numberOfLines={1}>{tx.description}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={s.txMeta}>{cat?.name ?? 'Sin categoría'}  ·  {formatDate(tx.date)}</Text>
                      {acc && (
                        <View style={[s.accPill, { backgroundColor: acc.color + '25' }]}>
                          <Ionicons name={ACCOUNT_TYPE_ICONS[acc.type]} size={10} color={acc.color} />
                          <Text style={[s.accPillText, { color: acc.color }]}>{acc.name}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={[s.txAmount, { color: isIncome ? C.income : C.expense }]}>
                    {isIncome ? '+' : '−'}{formatCurrency(tx.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TransactionModal
        visible={modalVisible}
        defaultType={modalType}
        defaultAccountId={defaultAccId}
        prefillQuick={prefill}
        onClose={() => { setModalVisible(false); setPrefill(null); setDefaultAccId(undefined); }}
      />
    </View>
  );
}

// ──── ESTILOS ────────────────────────────────────────────────────────────────

const styles = (C: typeof Colors.light, isDark: boolean, topPad: number) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },
    header: { backgroundColor: C.card, paddingTop: topPad + 8, paddingHorizontal: 20, paddingBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.07, shadowRadius: 8, elevation: 4 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: C.text },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    disponibleLabel: { fontSize: 13, color: C.textSecondary, fontWeight: '500', marginBottom: 4 },
    balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    balanceAmount: { fontSize: 44, fontWeight: '900', letterSpacing: -1, flex: 1 },
    balanceHidden: { fontSize: 28, color: C.textSecondary, letterSpacing: 6, flex: 1 },
    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.background, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
    statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    statLabel: { fontSize: 11, color: C.textSecondary, marginBottom: 1 },
    statValue: { fontSize: 15, fontWeight: '700' },
    statDivider: { width: 1, height: 32, backgroundColor: C.border, marginHorizontal: 12 },
    // Botones
    actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 20, marginBottom: 8 },
    incomeBtn: { flex: 1, backgroundColor: C.income, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: C.income, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
    expenseBtn: { flex: 1, backgroundColor: C.expense, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: C.expense, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
    actionLabel: { fontSize: 15, fontWeight: '800', color: '#fff' },
    actionSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
    // Secciones
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 22, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text },
    sectionHint: { fontSize: 11, color: C.textSecondary },
    verTodasBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    verTodasText: { fontSize: 13, fontWeight: '600' },
    // Tarjetas de cuenta
    accountsList: { paddingHorizontal: 16, gap: 12 },
    accountCard: { width: CARD_W, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
    accountCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    accountIconBg: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
    accountCardName: { fontSize: 16, fontWeight: '800', color: '#fff' },
    accountCardType: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
    accountCardLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
    accountCardBalance: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    limitBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
    limitFill: { height: '100%', borderRadius: 3 },
    limitLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
    cutoffLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
    // Accesos recurrentes
    quickList: { paddingHorizontal: 16, gap: 10 },
    quickCard: { width: 120, backgroundColor: C.card, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0.3 : 0.08, shadowRadius: 8, elevation: 4 },
    quickIconBg: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    quickName: { fontSize: 12, fontWeight: '700', color: C.text, textAlign: 'center' },
    quickAmount: { fontSize: 12, fontWeight: '800' },
    quickAmountFree: { fontSize: 10, color: C.textSecondary },
    recurrencePill: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8, backgroundColor: C.border },
    recurrencePillText: { fontSize: 9, fontWeight: '700' },
    // Movimientos
    countBadge: { backgroundColor: C.border, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    countText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
    txCard: { marginHorizontal: 16, backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0.3 : 0.07, shadowRadius: 10, elevation: 4 },
    txItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
    txBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
    txIconBg: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    txInfo: { flex: 1 },
    txDesc: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 3 },
    txMeta: { fontSize: 12, color: C.textSecondary },
    txAmount: { fontSize: 15, fontWeight: '800' },
    accPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    accPillText: { fontSize: 10, fontWeight: '700' },
    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
    emptyIconBg: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 8 },
    emptyText: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  });
