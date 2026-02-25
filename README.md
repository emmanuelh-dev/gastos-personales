# 💰 Mi Cartera - App de Control de Gastos

Una aplicación universal para la gestión de finanzas personales rápida, elegante y completamente funcional en **iOS, Android y Web**, construida con **React Native** y **Expo**.

## ✨ Características Principales

- 📊 **Panel de Control con Gráficas:** Visualiza tus ingresos y gastos de forma clara utilizando gráficos de **barras** y de **líneas flexibles**, filtrando por últimos 7 días, 30 días o este mes.
- 💸 **Registro Rápido:** Agrega tus ingresos y egresos en cuestión de segundos.
- 🏦 **Múltiples Cuentas:** Gestiona tarjetas de **Crédito** (con límites, fechas de corte y de pago), **Débito** y **Efectivo**. Todo sincronizado con tu balance total.
- 🏷️ **Categorías Personalizables:** Asigna tus transacciones a categorías con iconos y colores personalizados para saber rápidamente a dónde va tu dinero.
- ⚡ **Accesos Recurrentes (Rápidos):** Registra con un solo toque aquellos gastos que haces repetidamente (como Netflix, Spotify, Pasajes, etc.).
- 🌗 **Modo Oscuro/Claro:** Elige el tema que mejor se adapte a tu estilo; todos los colores y diseños se ajustan automáticamente de forma nativa.
- 🔒 **100% Privado y Offline:** Todos tus datos financieros se guardan **localmente en tu dispositivo** usando `AsyncStorage`. No hay bases de datos externas de terceros ni inicios de sesión; ¡tu información es solo tuya!

---

## 🚀 Empezando (Para Desarrolladores)

Si quieres correr o modificar el proyecto en tu máquina local, sigue estos pasos:

### 1. Instalar dependencias
Asegúrate de tener Node.js instalado y ejecuta en la raíz del proyecto:
```bash
npm install
```

### 2. Levantar la aplicación
Usa la interfaz de línea de comando de Expo para iniciar el servidor de desarrollo:
```bash
npx expo start
```
Si deseas abrirlo directamente en la web:
```bash
npx expo start --web
```

---

## 🛠️ Stack Tecnológico

- **Framework:** [React Native](https://reactnative.dev) + [Expo](https://expo.dev) 
- **Enrutamiento:** [Expo Router](https://docs.expo.dev/router/introduction) (File-based routing)
- **Persistencia de Datos:** `@react-native-async-storage/async-storage`
- **Iconos:** `@expo/vector-icons` (Ionicons)
- **Gráficas:** `react-native-gifted-charts` + `react-native-svg`
- **Estilos:** Custom StyleSheet theme contextual (sin librerías pesadas) con soporte de modo oscuro fluido.

---

## 🚑 Solución de Problemas (Troubleshooting) / "¿Qué pasa si no funciona?"

Durante el desarrollo o el uso de la web, podrías encontrarte con algunas incidencias menores ocasionadas por la caché. Sigue estos pasos si algo "se rompe" o "no funciona":

### 1. La aplicación se quedó en blanco o no carga 
Es posible que el empaquetador de Metro (bundler) tenga caché corrupta. Para solucionarlo, detén el servidor en la terminal (`Ctrl + C`) y reinícialo limpiando la caché con el siguiente comando:
```bash
npx expo start -c
```

### 2. Mis cuentas/gastos desaparecieron o se comportan raro
La app guarda la información en el almacenamiento local del dispositivo o navegador. Si modificaste parte del código estructural (`FinanceContext.ts`) podría requerir reiniciar la persistencia del estado:
- **En la Web:** Presiona `F12` para abrir las herramientas de desarrollador -> Ve a la pestaña de **Aplicación (Application)** -> En **Almacenamiento Local (Local Storage)** borra todos los datos y recarga la página.
- **En Android/iOS (Expo Go):** Cierra y abre completamente la aplicación Expo Go o, si todo falla, borra los datos/caché de la app Expo Go desde los ajustes del teléfono.

### 3. No cambian las gráficas o el tema de color
Si notas que un modo oscuro no cambia elementos pasados tras alterar código fuente en componentes sin montar, **recarga (Reload)** la app (`R` en el teclado dentro de la terminal que ejecuta Expo). Las pantallas pre-cargadas podrían necesitar re-montarse en compilación Web en caliente (HMR).

---

## 💻 Contacto y Soporte 
Siéntete libre de navegar modificar el código a tus necesidades. Los puntos principales de lógica de finanzas se encuentran en `context/FinanceContext.tsx` y el manejo unificado del tema gráfico está en `constants/theme.ts`.
