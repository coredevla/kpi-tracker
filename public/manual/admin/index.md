# Manual del administrador · KPI Tracker

Guía para configurar personal, metas, usuarios y operación completa del sistema.

---

## 1. Acceso

**URL:** [Iniciar sesión](/#/login)

![Pantalla de login](imagenes/01-login.svg)

1. Ingresa tu **correo** y **contraseña** de administrador.
2. Pulsa **Entrar**.

> Las credenciales se crean en Supabase (Authentication → Users). No uses la contraseña del panel supabase.com.

---

## 2. Navegación (admin)

Como administrador ves **todas** las secciones del menú.

![Menú administrador](imagenes/02-navbar-admin.svg)

| Sección | Función |
|---------|---------|
| Dashboard | Metas del equipo o por persona |
| Bitácora | Registrar ventas (cualquier persona) |
| Reportes | Análisis, Excel y respaldo JSON |
| Personal | Catálogo de vendedoras |
| Servicios | KPIs / catálogo de servicios |
| Asignaciones | Metas por persona y PRI |
| Usuarios | Cuentas de acceso y roles |
| **Ayuda** | Manuales de usuario (este documento y manual representante) |

---

## 3. Flujo: alta de un representante (completo)

```
Personal → Asignaciones (+ PRI) → Usuarios → entrega credenciales
```

### 3.1 Crear personal (obligatorio)

**Menú → Personal → + Nuevo**

![Nuevo personal](imagenes/03-personal-nuevo.svg)

- Completa al menos **Nombre**.
- Guarda. Debe quedar **Activa**.

### 3.2 Asignaciones y meta PRI (recomendado)

**Menú → Asignaciones**

![Asignaciones](imagenes/04-asignaciones.svg)

1. Selecciona el **periodo** (mes actual).
2. Filtra por la persona.
3. **Generar todas** — crea metas de todos los servicios activos.
4. Ajusta objetivos si hace falta.

**Metas PRI · Ingresos** (misma pantalla):

![Metas PRI](imagenes/05-metas-pri.svg)

- Define el objetivo mensual en **RD$** por persona.
- Pulsa **Guardar** (icono disco) en cada fila.

### 3.3 Crear usuario representante (obligatorio)

**Menú → Usuarios → + Nuevo usuario**

![Nuevo usuario](imagenes/06-usuario-nuevo.svg)

| Campo | Regla |
|-------|-------|
| Correo | Sin errores de escritura |
| Contraseña | Mín. 6 caracteres; anótala para entregar |
| Rol | **Representante de venta** |
| Persona enlazada | Obligatorio |

![Lista de usuarios](imagenes/07-usuarios-lista.svg)

- **Desactivar** impide el login (no borra datos).
- No puedes desactivarte a ti mismo (badge **tú**).
- Reset de contraseña ajena: **Supabase → Authentication → Users**.

---

## 4. Servicios (KPI)

**Menú → Servicios**

![Servicios](imagenes/08-servicios.svg)

- Catálogo de KPIs (15 servicios precargados al primer uso).
- **Objetivo mensual** = meta por defecto al generar asignaciones.
- **Activo** = disponible para asignaciones y bitácora.

---

## 5. Bitácora (vista admin)

**Menú → Bitácora**

![Bitácora](imagenes/09-bitacora.svg)

Puedes filtrar por **persona** y registrar ventas en nombre de cualquiera.

![Registrar venta](imagenes/10-bitacora-modal.svg)

| Campo | Regla |
|-------|-------|
| Cantidad | ≥ 0 |
| Monto (RD$) | ≥ 0 → suma al **PRI** |
| Tipo | Venta o Reclamación (ambas suman al PRI) |

---

## 6. Dashboard

**Menú → Dashboard**

![Dashboard](imagenes/11-dashboard.svg)

- Filtra **persona** o **todo el equipo**.
- Elige **periodo** (mes).
- Tarjetas por servicio + bloque **PRI · Ingresos**.
- Clic en tarjeta → detalle de ventas del servicio.

---

## 7. Reportes

**Menú → Reportes**

![Reportes](imagenes/12-reportes.svg)

- Rango **3 / 6 / 12 meses**.
- Filtro por **persona** y **tipo de gestión**.
- **Excel** — exporta el reporte visible.
- **Exportar / Importar** — respaldo JSON completo (solo admin).

![Respaldo JSON](imagenes/13-backup.svg)

> Importar **sobrescribe** todos los datos. Usar con precaución.

---

## 8. Cerrar sesión

![Cerrar sesión](imagenes/14-logout.svg)

Icono de salida en la barra superior → vuelves al login.

---

## Reglas importantes

- **KPI servicio** = cantidad · **PRI** = monto (RD$).
- Periodo = **YYYY-MM**. Semana laboral: **Lun–Sáb**.
- Un representante = **una persona** enlazada; una persona = **un usuario**.
- Supabase: **Confirm email desactivado** al crear usuarios desde la app.

---

## Problemas frecuentes

| Síntoma | Solución |
|---------|----------|
| Usuario no entra | Verificar correo en Auth; reset password en Supabase |
| Dashboard en cero | Generar asignaciones del mes |
| PRI en cero | Definir meta PRI + montos en bitácora |
| Error al crear usuario en Auth | Re-ejecutar `supabase/schema.sql` (trigger perfiles) |
| Email "Waiting for verification" | Desactivar Confirm email en Supabase |

---

## Checklist nuevo representante

- [ ] Personal creado y activo
- [ ] Asignaciones del mes
- [ ] Meta PRI en RD$
- [ ] Usuario con correo correcto y persona enlazada
- [ ] Credenciales entregadas
- [ ] Prueba de login y bitácora
