import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { BalanceWidget } from './BalanceWidget';

export const WIDGET_DATA_KEY = '@widget_data_v1';

interface WidgetData {
  balance: string;
  income: string;
  expense: string;
}

/**
 * Lee los datos del widget guardados en AsyncStorage.
 * El FinanceContext los escribe cada vez que cambia el balance.
 */
async function getWidgetData(): Promise<WidgetData> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignorar errores de lectura
  }
  return { balance: '$0.00', income: '$0.00', expense: '$0.00' };
}

function renderBalanceWidget(
  props: WidgetTaskHandlerProps,
  data: WidgetData
) {
  props.renderWidget(
    <BalanceWidget
      balance={data.balance}
      income={data.income}
      expense={data.expense}
    />
  );
}

/**
 * Handler principal del widget. Se ejecuta en un proceso de JS independiente.
 * Recibe los eventos del widget y retorna el componente a renderizar.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const data = await getWidgetData();

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      renderBalanceWidget(props, data);
      break;
    }

    // Clics de botones — WIDGET_CLICK con clickActionData
    case 'WIDGET_CLICK': {
      const action = (props.clickActionData as { action?: string })?.action;

      if (action === 'ADD_INCOME' || action === 'ADD_EXPENSE') {
        // La app se abre vía el intent configurado en MainActivity.
        // El parámetro `action` viaja como extra en el intent.
        // Aquí solo re-renderizamos para feedback visual.
        renderBalanceWidget(props, data);
      } else {
        // Actualizar balance al tocar cualquier otro lugar
        renderBalanceWidget(props, data);
      }
      break;
    }

    case 'WIDGET_DELETED':
    default:
      break;
  }
}
