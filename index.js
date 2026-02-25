import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widgets/WidgetTaskHandler';

// Registrar el handler del widget ANTES de importar expo-router
// para que esté disponible cuando el sistema Android invoque el widget
registerWidgetTaskHandler(widgetTaskHandler);

// Importar el entry point de expo-router normalmente
import 'expo-router/entry';
