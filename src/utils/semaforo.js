// Semáforo de estado pedido en las pruebas de usuario (Sprint 5):
//   verde    = completada
//   amarillo = pendiente o pospuesta (aún a tiempo)
//   rojo     = pendiente con el plazo ya vencido
// Las fechas se comparan como "YYYY-MM-DD" en hora local.

function hoyLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function esCompletada(estado) {
  const e = (estado || "").toLowerCase();
  return e === "completada" || e === "ejecutada";
}

export function semaforoGestion(subtarea, hoy = hoyLocal()) {
  const estado = (subtarea?.estado || "").toLowerCase();
  if (esCompletada(estado)) return { color: "verde", texto: "Hecha" };
  if (estado === "pospuesta") return { color: "amarillo", texto: "Pospuesta" };
  if (subtarea?.plazo && String(subtarea.plazo) < hoy) {
    return { color: "rojo", texto: "Vencida" };
  }
  return { color: "amarillo", texto: "Pendiente" };
}

export function semaforoEvento(subtareas = [], hoy = hoyLocal()) {
  if (subtareas.length === 0) return { color: "amarillo", texto: "Sin gestiones" };
  const colores = subtareas.map((s) => semaforoGestion(s, hoy).color);
  if (colores.includes("rojo")) {
    const vencidas = colores.filter((c) => c === "rojo").length;
    return {
      color: "rojo",
      texto: `Atrasado · ${vencidas} ${vencidas === 1 ? "vencida" : "vencidas"}`,
    };
  }
  if (colores.every((c) => c === "verde")) return { color: "verde", texto: "Completo" };
  return { color: "amarillo", texto: "En curso" };
}
