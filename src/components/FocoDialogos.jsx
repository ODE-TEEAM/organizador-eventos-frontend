import { useEffect } from "react";

// Accesibilidad de teclado para TODOS los modales de la app.
// Cualquier elemento con role="dialog" + aria-modal="true" que aparezca:
//  1) recibe el foco en su primer control al abrirse,
//  2) mantiene el foco dentro con Tab / Shift+Tab (no se "escapa" al fondo),
//  3) al cerrarse, devuelve el foco al botón que lo abrió.
// Así no hay que repetir esta lógica en cada página (Hoy, Evento, Perfil...).

const ENFOCABLES = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function enfocablesDe(dialogo) {
  return Array.from(dialogo.querySelectorAll(ENFOCABLES)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
}

function dialogoActivo() {
  const abiertos = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
  return abiertos.length ? abiertos[abiertos.length - 1] : null;
}

export default function FocoDialogos() {
  useEffect(() => {
    let actual = null;
    let focoPrevio = null;

    const sincronizar = () => {
      const dialogo = dialogoActivo();
      if (dialogo === actual) return;

      if (dialogo) {
        // Se abrió un modal (o se pasó de uno a otro): recordar quién lo
        // abrió la primera vez y enfocar dentro del nuevo.
        if (!actual) focoPrevio = document.activeElement;
        const preferido =
          dialogo.querySelector("input:not([disabled]), textarea:not([disabled])") ||
          enfocablesDe(dialogo)[0];
        if (!dialogo.hasAttribute("tabindex")) dialogo.setAttribute("tabindex", "-1");
        (preferido || dialogo).focus({ preventScroll: true });
      } else {
        // Se cerró: devolver el foco a donde estaba el usuario.
        if (focoPrevio && document.contains(focoPrevio)) {
          focoPrevio.focus({ preventScroll: true });
        }
        focoPrevio = null;
      }
      actual = dialogo;
    };

    const atraparTab = (e) => {
      if (e.key !== "Tab") return;
      const dialogo = dialogoActivo();
      if (!dialogo) return;

      const lista = enfocablesDe(dialogo);
      if (lista.length === 0) {
        e.preventDefault();
        dialogo.focus();
        return;
      }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const dentro = dialogo.contains(document.activeElement);

      if (e.shiftKey && (document.activeElement === primero || !dentro)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) {
        e.preventDefault();
        primero.focus();
      }
    };

    const observador = new MutationObserver(sincronizar);
    observador.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("keydown", atraparTab);
    sincronizar();

    return () => {
      observador.disconnect();
      document.removeEventListener("keydown", atraparTab);
    };
  }, []);

  return null;
}
