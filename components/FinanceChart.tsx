import { Colors } from '@/constants/theme';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

type Period = '7d' | '30d' | 'month';
type ChartType = 'bar' | 'line';

export default function FinanceChart() {
  const { scheme } = useTheme();
  const C = Colors[scheme];
  const { transactions } = useFinance();

  const [period, setPeriod] = useState<Period>('7d');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [baseDate, setBaseDate] = useState<Date>(new Date());

  const shiftDate = (days: number) => {
    setBaseDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      // No permitir fechas futuras
      if (next > new Date()) return prev;
      return next;
    });
  };

  const isToday = baseDate.toDateString() === new Date().toDateString();

  const { chartData, maxValue, lineDataIncome, lineDataExpense, hasData } = useMemo(() => {
    const today = new Date(baseDate);
    today.setHours(0, 0, 0, 0);

    let daysToGenerate = 7;
    if (period === '30d') daysToGenerate = 30;
    else if (period === 'month') {
      daysToGenerate = Math.max(7, today.getDate()); // Mostrar al menos 7 días aunque sea inicio de mes
    }

    const incomeByDay: Record<string, number> = {};
    const expenseByDay: Record<string, number> = {};

    transactions.forEach(t => {
      const d = new Date(t.date);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];
      if (t.type === 'income') {
        incomeByDay[localISOTime] = (incomeByDay[localISOTime] || 0) + Math.abs(t.amount);
      } else {
        expenseByDay[localISOTime] = (expenseByDay[localISOTime] || 0) + Math.abs(t.amount);
      }
    });

    const data: any[] = [];
    const lineInc: any[] = [];
    const lineExp: any[] = [];
    let max = 0;

    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];

      let dayLabel = '';
      if (period === '7d') {
        dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short' });
      } else {
        dayLabel = d.getDate().toString();
      }

      const income = incomeByDay[localISOTime] || 0;
      const expense = expenseByDay[localISOTime] || 0;

      if (income > max) max = income;
      if (expense > max) max = expense;

      // Para que no se encimen los labels en los de 30 días, mostramos 1 label cada ~5 días o el primero y último
      let showLabel = true;
      if (daysToGenerate > 10) {
        showLabel = (i % 5 === 0) || i === 0 || i === daysToGenerate - 1;
      }

      data.push({
        value: income,
        spacing: 2,
        label: showLabel ? (period === '7d' ? dayLabel.substring(0, 3).toUpperCase() : dayLabel) : '',
        labelWidth: 30,
        labelTextStyle: { color: C.textSecondary, fontSize: 10, textAlign: 'center' },
        frontColor: C.income,
      });
      data.push({
        value: expense,
        frontColor: C.expense,
      });

      lineInc.push({
        value: income,
        label: showLabel ? (period === '7d' ? dayLabel.substring(0, 3).toUpperCase() : dayLabel) : '',
        labelTextStyle: { color: C.textSecondary, fontSize: 10, textAlign: 'center' },
      });
      lineExp.push({
        value: expense,
      });
    }

    max = max * 1.2;
    if (max < 100) max = 100;

    const hasData = max > 100 || data.some((d: any) => d.value > 0);

    return { chartData: data, maxValue: max, lineDataIncome: lineInc, lineDataExpense: lineExp, hasData };
  }, [transactions, period, baseDate, C.income, C.expense, C.textSecondary]);

  if (transactions.length === 0) {
    return (
      <View style={{ height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: C.card, marginHorizontal: 20, borderRadius: 20, marginTop: 24 }}>
        <Text style={{ color: C.textSecondary }}>No hay movimientos para mostrar</Text>
      </View>
    );
  }

  const chartWidth = Dimensions.get('window').width - 80;

  const renderFilterBtn = (id: Period, label: string) => {
    const active = period === id;
    return (
      <TouchableOpacity
        onPress={() => setPeriod(id)}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: active ? C.border : 'transparent',
        }}
      >
        <Text style={{ fontSize: 12, color: active ? C.text : C.textSecondary, fontWeight: active ? '700' : '500' }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ backgroundColor: C.card, marginHorizontal: 20, borderRadius: 24, paddingVertical: 20, marginTop: 24, overflow: 'hidden' }}>

      {/* Header y Filtros */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>Resumen</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Selector de Fecha */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.border + '60', borderRadius: 12 }}>
            <TouchableOpacity onPress={() => shiftDate(-1)} style={{ padding: 6 }}>
              <Ionicons name="chevron-back" size={16} color={C.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setBaseDate(new Date())} style={{ paddingHorizontal: 4, paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: isToday ? C.tint : C.text, fontWeight: '600', minWidth: 42, textAlign: 'center' }}>
                {isToday ? 'Hoy' : baseDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => shiftDate(1)} disabled={isToday} style={{ padding: 6, opacity: isToday ? 0.3 : 1 }}>
              <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}>
            <Ionicons name={chartType === 'bar' ? 'stats-chart' : 'bar-chart'} size={20} color={C.tint} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 20, marginBottom: 24 }}>
        {renderFilterBtn('7d', '7 Días')}
        {renderFilterBtn('30d', '30 Días')}
        {renderFilterBtn('month', 'Este Mes')}
      </View>

      <View style={{ paddingLeft: 10 }}>
        {!hasData ? (
          <View style={{ height: 160, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="folder-open-outline" size={32} color={C.border} style={{ marginBottom: 12 }} />
            <Text style={{ color: C.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: 30 }}>No hay movimientos registrados para este rango de fechas.</Text>
          </View>
        ) : chartType === 'bar' ? (
          <BarChart
            data={chartData}
            barWidth={period === '7d' ? 10 : 4}
            spacing={period === '7d' ? 16 : 8}
            roundedTop
            roundedBottom
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: C.textSecondary, fontSize: 10 }}
            noOfSections={4}
            maxValue={maxValue}
            width={chartWidth}
            height={160}
            initialSpacing={10}
            isAnimated
          />
        ) : (
          <LineChart
            data={lineDataIncome}
            data2={lineDataExpense}
            color1={C.income}
            color2={C.expense}
            thickness={3}
            areaChart
            startFillColor1={C.income}
            startFillColor2={C.expense}
            endFillColor1={C.income}
            endFillColor2={C.expense}
            startOpacity={0.2}
            endOpacity={0.0}
            hideDataPoints={period !== '7d'}
            dataPointsColor1={C.income}
            dataPointsColor2={C.expense}
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: C.textSecondary, fontSize: 10 }}
            noOfSections={4}
            maxValue={maxValue}
            width={chartWidth}
            height={160}
            initialSpacing={10}
            isAnimated
            spacing={chartWidth / (period === '7d' ? 6 : (period === '30d' ? 29 : Math.max(6, new Date(baseDate).getDate() - 1)))}
          />
        )}
      </View>

      {/* Leyenda */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.income }} />
          <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '500' }}>Ingresos</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.expense }} />
          <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '500' }}>Gastos</Text>
        </View>
      </View>
    </View>
  );
}
