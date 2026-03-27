# Sistema de Comedor Escolar (RFID + Firebase)

Este sistema gestiona un comedor escolar mediante el uso exclusivo de tarjetas RFID, saldos pre-cargados, fiados (deuda) y pedidos anticipados mediante interfaz táctil (Kiosco).

## 🚀 Instalación y Uso

1. **Dependencias:**
   Asegúrese de tener Node.js y npm instalados. Ubíquese en la raíz del proyecto y corra:
   ```bash
   npm install
   ```

2. **Configuración de Firebase:**
   El archivo `.env` ya contiene las variables de entorno de Firebase que proporcionó. 
   La estructura de Firestore debe existir de esta forma:
   - `alumnos` (Documento con `nombre`, `balance`, `rfid`, `curso`, `activo`)
   - `productos` (Documento con `nombre`, `precio`, `categoria` (ej: 'almuerzo'), `activo`)
   - `pedidos` (Autogenerado por la app)
   - `movimientos` (Autogenerado por la app)

3. **Ejecutar Desarrollo:**
   ```bash
   npm run dev
   ```
   Luego acceda a `http://localhost:5173`.

## 🖥️ Rutas Disponibles en la Plataforma

El sistema integra todas las necesidades de la escuela en una misma aplicación:

- **`/`**: Kiosco - Pantalla Principal de espera (escucha RFID globalmente).
- **`/menu`**: Kiosco - Selección de menú anticipado (Bloqueado lógicamente para aceptar órdenes solo de 07:00 a 10:00).
- **`/kitchen`**: Panel Buffet - Gestión de pedidos en tiempo real con sistema tipo Kanban.
- **`/checkout`**: Caja de Cobro - Retiro de viandas y Venta directa (POS) pagando con Saldo o Fiado.
- **`/admin`**: Panel Administrador - Resumen de deudas, alumnos activos y ventas acumuladas.

## 📡 Uso del Lector RFID

El sistema captura el lector RFID transparente gracias al hook `useRfidReader`. Si tiene un lector USB "Plug and Play", simplemente posicione a la aplicación en la pantalla y pase la tarjeta; el sistema tomará la serie de tipeos ultra-rápidos que el lector emite y ejecutará el inicio de sesión.
