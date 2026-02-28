import { Colors } from '@/constants/theme';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

type Period = '7d' | '30d' | 'month';
type ChartMode = 'bar' | 'line' | 'balance';

const CHART_MODES: { key: ChartMode; icon: string; label: string }[] = [
  { key: 'bar', icon: 'bar-chart', label: 'Barras' },
  { key: 'line', icon: 'stats-chart', label: 'Área' },
  { key: 'balance', icon: 'trending-up', label: 'Balance' },
];

export default function FinanceChart() {
  const { scheme } = useTheme();
  const C = Colors[scheme];
  const { transactions } = useFinance();

  const [period, setPeriod] = useState<Period>('7d');
  const [mode, setMode] = useState<ChartMode>('bar');
  const [baseDate, setBaseDate] = useState<Date>(new Date());

  const shiftDate = (days: number) => {
    setBaseDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      if (next > new Date()) return prev;
      return next;
    });
  };

  const isToday = baseDate.toDateString() === new Date().toDateString();

  // ── Cálculo de datos ───────────────────────────────────────────────────────
  const computed = useMemo(() => {
    const today = new Date(baseDate);
    today.setHours(23, 59, 59, 999);

    let daysToShow = 7;
    if (period === '30d') daysToShow = 30;
    else if (period === 'month') daysToShow = Math.max(7, new Date(baseDate).getDate());

    // Agrupar transacciones por día (excluyendo transferencias)
    const incomeByDay: Record<string, number> = {};
    const expenseByDay: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.transferId) return; // excluir transferencias del resumen
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (t.type === 'income') {
        incomeByDay[key] = (incomeByDay[key] || 0) + t.amount;
      } else {
        expenseByDay[key] = (expenseByDay[key] || 0) + t.amount;
      }
    });

    // Calcular balance hasta el día ANTES del rango para usarlo como base
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - (daysToShow - 1));
    rangeStart.setHours(0, 0, 0, 0);

    let runningBalance = 0;
    transactions.forEach(t => {
      if (t.transferId) return;
      const d = new Date(t.date);
      if (d < rangeStart) {
        runningBalance += t.type === 'income' ? t.amount : -t.amount;
      }
    });

    // Construir arrays de datos punto a punto
    const barData: any[] = [];
    const lineInc: any[] = [];
    const lineExp: any[] = [];
    const balanceLine: any[] = [];

    let maxBarVal = 0;
    let minBalance = Infinity;
    let maxBalance = -Infinity;

    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const income = incomeByDay[key] || 0;
      const expense = expenseByDay[key] || 0;
      const net = income - expense;
      runningBalance += net;

      if (income > maxBarVal) maxBarVal = income;
      if (expense > maxBarVal) maxBarVal = expense;
      if (runningBalance < minBalance) minBalance = runningBalance;
      if (runningBalance > maxBalance) maxBalance = runningBalance;

      // Etiquetas del eje X
      const showLabel = daysToShow <= 10 || (i % 5 === 0) || i === 0 || i === daysToShow - 1;
      const dayLabel = period === '7d'
        ? d.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 3).toUpperCase()
        : String(d.getDate());

      const labelStyle = { color: C.textSecondary, fontSize: 10, textAlign: 'center' as const };
      const labelVal = showLabel ? dayLabel : '';

      // Barras: par income/expense
      barData.push({ value: income, spacing: 2, label: labelVal, labelWidth: 30, labelTextStyle: labelStyle, frontColor: C.income });
      barData.push({ value: expense, frontColor: C.expense });

      // Línea área
      lineInc.push({ value: income, label: labelVal, labelTextStyle: labelStyle });
      lineExp.push({ value: expense });

      // Balance acumulado
      balanceLine.push({
        value: runningBalance,
        label: labelVal,
        labelTextStyle: labelStyle,
        // color del punto según si subió o bajó
        dataPointColor: net >= 0 ? C.income : C.expense,
      });
    }

    const maxBar = Math.max(maxBarVal * 1.25, 100);
    const hasData = transactions.some(t => {
      const d = new Date(t.date);
      return d >= rangeStart && d <= today;
    });

    // Para el gráfico de balance: normalizar máximos/mínimos
    const balancePad = Math.abs(maxBalance - minBalance) * 0.2 || 100;
    const balanceMax = maxBalance + balancePad;
    const balanceMin = Math.min(minBalance - balancePad, 0);

    return {
      barData, lineInc, lineExp, balanceLine,
      maxBar, hasData,
      balanceMax, balanceMin,
      lastBalance: balanceLine[balanceLine.length - 1]?.value ?? 0,
      prevBalance: balanceLine[balanceLine.length - 2]?.value ?? 0,
      daysToShow,
    };
  }, [transactions, period, baseDate, C.income, C.expense, C.textSecondary, C.tint]);

  const { barData, lineInc, lineExp, balanceLine, maxBar, hasData,
    balanceMax, balanceMin, lastBalance, prevBalance, daysToShow } = computed;

  const chartWidth = Dimensions.get('window').width - 80;
  const spacingLine = chartWidth / Math.max(daysToShow - 1, 1);
  const balanceDiff = lastBalance - prevBalance;

  if (transactions.length === 0) {
    return (
      <View style={{ height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: C.card, marginHorizontal: 20, borderRadius: 20, marginTop: 24 }}>
        <Ionicons name="bar-chart-outline" size={36} color={C.border} style={{ marginBottom: 10 }} />
        <Text style={{ color: C.textSecondary }}>Sin movimientos para mostrar</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: C.card, marginHorizontal: 20, borderRadius: 24, paddingTop: 20, paddingBottom: 16, marginTop: 24, overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 4 }}>
        <View>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '800' }}>Resumen</Text>
          {mode === 'balance' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Text style={{ color: C.textSecondary, fontSize: 11 }}>Balance hoy </Text>
              <Text style={{ color: balanceDiff >= 0 ? C.income : C.expense, fontSize: 12, fontWeight: '700' }}>
                {balanceDiff >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(balanceDiff))} vs ayer
              </Text>
            </View>
          )}
        </View>

        {/* Navegación de fecha */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.border + '55', borderRadius: 12 }}>
          <TouchableOpacity onPress={() => shiftDate(-1)} style={{ padding: 6 }}>
            <Ionicons name="chevron-back" size={16} color={C.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setBaseDate(new Date())} style={{ paddingHorizontal: 4, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, color: isToday ? C.tint : C.text, fontWeight: '600', minWidth: 44, textAlign: 'center' }}>
              {isToday ? 'Hoy' : baseDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => shiftDate(1)} disabled={isToday} style={{ padding: 6, opacity: isToday ? 0.3 : 1 }}>
            <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── FILTROS DE PERÍODO ── */}
      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 20, marginBottom: 14, marginTop: 10 }}>
        {(['7d', '30d', 'month'] as Period[]).map((p) => {
          const labels: Record<Period, string> = { '7d': '7 días', '30d': '30 días', month: 'Este mes' };
          const active = period === p;
          return (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: active ? C.tint + '22' : 'transparent' }}
            >
              <Text style={{ fontSize: 12, color: active ? C.tint : C.textSecondary, fontWeight: active ? '700' : '500' }}>
                {labels[p]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── SELECTOR DE TIPO DE GRÁFICO ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginBottom: 20 }}>
        {CHART_MODES.map(({ key, icon, label }) => {
          const active = mode === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setMode(key)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14,
                backgroundColor: active ? C.tint : C.background,
                borderWidth: 1.5, borderColor: active ? C.tint : C.border,
              }}
            >
              <Ionicons name={icon as any} size={14} color={active ? '#fff' : C.textSecondary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: active ? '#fff' : C.textSecondary }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── RESUMEN RÁPIDO BALANCE (solo en modo balance) ── */}
      {mode === 'balance' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginBottom: 16, padding: 12, backgroundColor: C.background, borderRadius: 14 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: C.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Inicio rango</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: C.text, marginTop: 2 }}>
              {formatCurrency(balanceLine[0]?.value - ((lineInc[0]?.value || 0) - (lineExp[0]?.value || 0)))}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: C.border }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: C.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Balance hoy</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: lastBalance >= 0 ? C.income : C.expense, marginTop: 2 }}>
              {formatCurrency(lastBalance)}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: C.border }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 10, color: C.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Vs ayer</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: balanceDiff >= 0 ? C.income : C.expense, marginTop: 2 }}>
              {balanceDiff >= 0 ? '+' : ''}{formatCurrency(balanceDiff)}
            </Text>
          </View>
        </View>
      )}

      {/* ── GRÁFICO ── */}
      <View style={{ paddingLeft: 10 }}>
        {!hasData ? (
          <View style={{ height: 160, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="folder-open-outline" size={32} color={C.border} style={{ marginBottom: 10 }} />
            <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 }}>
              Sin movimientos en este período
            </Text>
          </View>
        ) : mode === 'bar' ? (
          <BarChart
            data={barData}
            barWidth={daysToShow <= 7 ? 10 : 4}
            spacing={daysToShow <= 7 ? 16 : 6}
            roundedTop roundedBottom
            hideRules
            xAxisThickness={0} yAxisThickness={0}
            yAxisTextStyle={{ color: C.textSecondary, fontSize: 10 }}
            noOfSections={4}
            maxValue={maxBar}
            width={chartWidth}
            height={160}
            initialSpacing={10}
            isAnimated
          />
        ) : mode === 'line' ? (
          <LineChart
            data={lineInc}
            data2={lineExp}
            color1={C.income}
            color2={C.expense}
            thickness={2.5}
            areaChart
            startFillColor1={C.income} startFillColor2={C.expense}
            endFillColor1={C.income} endFillColor2={C.expense}
            startOpacity={0.2} endOpacity={0.0}
            hideDataPoints={daysToShow > 10}
            dataPointsColor1={C.income} dataPointsColor2={C.expense}
            hideRules
            xAxisThickness={0} yAxisThickness={0}
            yAxisTextStyle={{ color: C.textSecondary, fontSize: 10 }}
            noOfSections={4}
            maxValue={maxBar}
            width={chartWidth}
            height={160}
            initialSpacing={10}
            spacing={spacingLine}
            isAnimated
          />
        ) : (
          <LineChart
            data={balanceLine}
            color1={C.tint}
            thickness={2.5}
            areaChart
            startFillColor1={C.tint}
            endFillColor1={C.tint}
            startOpacity={0.18}
            endOpacity={0.0}
            hideDataPoints={daysToShow > 14}
            dataPointsColor1={C.tint}
            dataPointsRadius={4}
            hideRules={false}
            rulesColor={C.border + '50'}
            rulesType="dashed"
            xAxisThickness={0} yAxisThickness={0}
            yAxisTextStyle={{ color: C.textSecondary, fontSize: 10 }}
            noOfSections={4}
            maxValue={balanceMax}
            width={chartWidth}
            height={160}
            initialSpacing={10}
            spacing={spacingLine}
            isAnimated
          />
        )}
      </View>

      {/* ── LEYENDA ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 14, gap: 16, paddingHorizontal: 20 }}>
        {mode !== 'balance' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.income }} />
              <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '500' }}>Ingresos</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.expense }} />
              <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '500' }}>Gastos</Text>
            </View>
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 24, height: 3, borderRadius: 2, backgroundColor: C.tint }} />
            <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '500' }}>Balance acumulado</Text>
          </View>
        )}
      </View>
    </View>
  );
}
