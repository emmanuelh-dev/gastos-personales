import { Colors } from '@/constants/theme';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import React, { useMemo } from 'react';
import { Dimensions, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export default function FinanceChart() {
  const { scheme } = useTheme();
  const C = Colors[scheme];
  const { transactions } = useFinance();

  const chartData = useMemo(() => {
    const data: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().split('T')[0];

      const dayLabel = d.toLocaleDateString('es-ES', { weekday: 'short' });

      const income = incomeByDay[localISOTime] || 0;
      const expense = expenseByDay[localISOTime] || 0;

      data.push({
        value: income,
        spacing: 2,
        label: dayLabel.substring(0, 3).toUpperCase(),
        labelWidth: 30,
        labelTextStyle: { color: C.textSecondary, fontSize: 10, textAlign: 'center' },
        frontColor: C.income,
      });
      data.push({
        value: expense,
        frontColor: C.expense,
      });
    }

    return data;
  }, [transactions, C.income, C.expense, C.textSecondary]);

  const maxValue = useMemo(() => {
    let max = 0;
    chartData.forEach(d => { if (d.value > max) max = d.value; });
    // Increase max by 20% to give top padding
    max = max * 1.2;
    return max < 100 ? 100 : max;
  }, [chartData]);

  if (transactions.length === 0) {
    return (
      <View style={{ height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: C.card, marginHorizontal: 20, borderRadius: 20, marginTop: 24 }}>
        <Text style={{ color: C.textSecondary }}>No hay movimientos para mostrar</Text>
      </View>
    );
  }

  const chartWidth = Dimensions.get('window').width - 80;

  return (
    <View style={{ backgroundColor: C.card, marginHorizontal: 20, borderRadius: 24, paddingVertical: 20, marginTop: 24, overflow: 'hidden' }}>
      <Text style={{ color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 24, paddingHorizontal: 20 }}>Últimos 7 días</Text>
      <View style={{ paddingLeft: 10 }}>
        <BarChart
          data={chartData}
          barWidth={10}
          spacing={16}
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
        />
      </View>
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
