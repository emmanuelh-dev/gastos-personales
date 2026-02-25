import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface BalanceWidgetProps {
  balance: string;
  income: string;
  expense: string;
}

export function BalanceWidget({ balance, income, expense }: BalanceWidgetProps) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0F1117',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* Header */}
      <TextWidget
        text="💰 Mi Cartera"
        style={{
          fontSize: 13,
          color: '#9BA3AF',
          fontFamily: 'sans-serif-medium',
        }}
      />

      {/* Balance principal */}
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <TextWidget
          text="Balance total"
          style={{ fontSize: 11, color: '#6B7280', fontFamily: 'sans-serif' }}
        />
        <TextWidget
          text={balance}
          style={{
            fontSize: 26,
            color: '#FFFFFF',
            fontFamily: 'sans-serif-medium',
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>

      {/* Ingresos / Gastos */}
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between' }}
      >
        {/* Ingresos */}
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#001A0D',
            borderRadius: 10,
            padding: 8,
            alignItems: 'flex-start',
            marginRight: 6,
          }}
        >
          <TextWidget
            text="▲ Ingresos"
            style={{ fontSize: 10, color: '#00D468', fontFamily: 'sans-serif' }}
          />
          <TextWidget
            text={income}
            style={{ fontSize: 13, color: '#00D468', fontFamily: 'sans-serif-medium' }}
          />
        </FlexWidget>

        {/* Gastos */}
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#1A0005',
            borderRadius: 10,
            padding: 8,
            alignItems: 'flex-start',
            marginLeft: 6,
          }}
        >
          <TextWidget
            text="▼ Gastos"
            style={{ fontSize: 10, color: '#F23D4F', fontFamily: 'sans-serif' }}
          />
          <TextWidget
            text={expense}
            style={{ fontSize: 13, color: '#F23D4F', fontFamily: 'sans-serif-medium' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Botones de acción */}
      <FlexWidget
        style={{ flexDirection: 'row', justifyContent: 'space-between' }}
      >
        {/* Botón Ingreso */}
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#00A650',
            borderRadius: 12,
            paddingVertical: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 6,
          }}
          clickAction="WIDGET_CLICK"
          clickActionData={{ action: 'ADD_INCOME' }}
        >
          <TextWidget
            text="＋ Ingreso"
            style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'sans-serif-medium' }}
          />
        </FlexWidget>

        {/* Botón Gasto */}
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#E53E3E',
            borderRadius: 12,
            paddingVertical: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 6,
          }}
          clickAction="WIDGET_CLICK"
          clickActionData={{ action: 'ADD_EXPENSE' }}
        >
          <TextWidget
            text="－ Gasto"
            style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'sans-serif-medium' }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
