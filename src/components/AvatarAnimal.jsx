// Avatares de animales: ilustraciones planas, redondas y de frente.
// Cada usuario recibe uno de forma estable (hash de su email/id),
// así su "animal compañero" no cambia entre sesiones.

const OJO = '#26202e';

export const ANIMALES = [
  {
    id: 'pelicano',
    nombre: 'Pelícano',
    fondo: '#d8eef9',
    cuerpo: (
      <g>
        <path d="M28 15 q2 -4 4 0 q2 -3 4 1" stroke="#e8e4da" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="32" cy="33" r="17" fill="#ffffff" />
        <circle cx="26" cy="28" r="2.3" fill={OJO} />
        <circle cx="38" cy="28" r="2.3" fill={OJO} />
        <path d="M23 34 C26 46 38 46 41 34 C37 38 27 38 23 34 Z" fill="#f4813f" />
        <ellipse cx="32" cy="33.5" rx="10" ry="3.6" fill="#fca33d" />
        <circle cx="32" cy="33" r="1" fill="#d97b23" />
      </g>
    ),
  },
  {
    id: 'tigre',
    nombre: 'Tigre',
    fondo: '#ffe9d2',
    cuerpo: (
      <g>
        <circle cx="19" cy="19" r="6.5" fill="#f78c3c" />
        <circle cx="45" cy="19" r="6.5" fill="#f78c3c" />
        <circle cx="19" cy="19" r="3.2" fill="#ffd9b0" />
        <circle cx="45" cy="19" r="3.2" fill="#ffd9b0" />
        <circle cx="32" cy="34" r="17" fill="#f78c3c" />
        <path d="M26 20 l2 5 M32 18.5 l0 5.5 M38 20 l-2 5" stroke="#c65a1e" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M15.5 32 l5 1.5 M16 38 l5 0.5 M48.5 32 l-5 1.5 M48 38 l-5 0.5" stroke="#c65a1e" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="32" cy="41" rx="9" ry="7" fill="#fff3e4" />
        <circle cx="25" cy="31" r="2.4" fill={OJO} />
        <circle cx="39" cy="31" r="2.4" fill={OJO} />
        <path d="M30 38 q2 -1.6 4 0 q-1 2.4 -2 2.4 q-1 0 -2 -2.4 Z" fill="#e2703a" />
        <path d="M32 40.5 q-1.5 2.5 -4 2 M32 40.5 q1.5 2.5 4 2" stroke="#c65a1e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'leon',
    nombre: 'León',
    fondo: '#fff3d0',
    cuerpo: (
      <g>
        <g fill="#d9772f">
          <circle cx="32" cy="13" r="6" />
          <circle cx="45" cy="18" r="6" />
          <circle cx="51" cy="31" r="6" />
          <circle cx="46" cy="44" r="6" />
          <circle cx="32" cy="50" r="6" />
          <circle cx="18" cy="44" r="6" />
          <circle cx="13" cy="31" r="6" />
          <circle cx="19" cy="18" r="6" />
        </g>
        <circle cx="32" cy="32" r="14" fill="#f6c08a" />
        <circle cx="27" cy="29" r="2.2" fill={OJO} />
        <circle cx="37" cy="29" r="2.2" fill={OJO} />
        <ellipse cx="32" cy="37.5" rx="6.5" ry="5" fill="#ffe3c0" />
        <path d="M30 35.5 q2 -1.4 4 0 q-1 2.2 -2 2.2 q-1 0 -2 -2.2 Z" fill="#8a4b21" />
        <path d="M32 37.8 q-1.4 2.2 -3.4 1.6 M32 37.8 q1.4 2.2 3.4 1.6" stroke="#8a4b21" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'zorro',
    nombre: 'Zorro',
    fondo: '#ffe4dc',
    cuerpo: (
      <g>
        <path d="M14 24 L21 9 L29 21 Z" fill="#e86a33" />
        <path d="M50 24 L43 9 L35 21 Z" fill="#e86a33" />
        <path d="M18.5 20.5 L21.5 13.5 L25.5 19 Z" fill="#ffd9c9" />
        <path d="M45.5 20.5 L42.5 13.5 L38.5 19 Z" fill="#ffd9c9" />
        <circle cx="32" cy="34" r="16.5" fill="#f07e3c" />
        <circle cx="23.5" cy="40" r="7.5" fill="#ffffff" />
        <circle cx="40.5" cy="40" r="7.5" fill="#ffffff" />
        <ellipse cx="32" cy="41" rx="6" ry="5.5" fill="#ffffff" />
        <circle cx="25" cy="30.5" r="2.3" fill={OJO} />
        <circle cx="39" cy="30.5" r="2.3" fill={OJO} />
        <circle cx="32" cy="39" r="2.5" fill="#402a23" />
      </g>
    ),
  },
  {
    id: 'oso',
    nombre: 'Oso',
    fondo: '#eaf0dc',
    cuerpo: (
      <g>
        <circle cx="19" cy="18.5" r="6.8" fill="#8c5a3b" />
        <circle cx="45" cy="18.5" r="6.8" fill="#8c5a3b" />
        <circle cx="19" cy="18.5" r="3.4" fill="#c99a76" />
        <circle cx="45" cy="18.5" r="3.4" fill="#c99a76" />
        <circle cx="32" cy="34" r="17" fill="#a06a45" />
        <ellipse cx="32" cy="40.5" rx="8.5" ry="6.5" fill="#ebc9a8" />
        <circle cx="25" cy="30" r="2.4" fill={OJO} />
        <circle cx="39" cy="30" r="2.4" fill={OJO} />
        <ellipse cx="32" cy="38" rx="3" ry="2.4" fill="#402a23" />
        <path d="M32 40.4 q-1.6 2.4 -3.8 1.8 M32 40.4 q1.6 2.4 3.8 1.8" stroke="#402a23" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'buho',
    nombre: 'Búho',
    fondo: '#e9e4ff',
    cuerpo: (
      <g>
        <path d="M17 24 L20 11 L28 19 Z" fill="#7a6bc4" />
        <path d="M47 24 L44 11 L36 19 Z" fill="#7a6bc4" />
        <circle cx="32" cy="34" r="17" fill="#7a6bc4" />
        <circle cx="25" cy="30.5" r="7.6" fill="#f4f1ff" />
        <circle cx="39" cy="30.5" r="7.6" fill="#f4f1ff" />
        <circle cx="25" cy="30.5" r="3.4" fill={OJO} />
        <circle cx="39" cy="30.5" r="3.4" fill={OJO} />
        <circle cx="26.2" cy="29.3" r="1.1" fill="#fff" />
        <circle cx="40.2" cy="29.3" r="1.1" fill="#fff" />
        <path d="M29 37 L35 37 L32 43 Z" fill="#f2a33c" />
        <path d="M26 46 q3 2.4 6 0 q3 2.4 6 0" stroke="#5d4fa8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'panda',
    nombre: 'Panda',
    fondo: '#e3f4ea',
    cuerpo: (
      <g>
        <circle cx="19" cy="17.5" r="6.2" fill="#2e2a33" />
        <circle cx="45" cy="17.5" r="6.2" fill="#2e2a33" />
        <circle cx="32" cy="34" r="17" fill="#ffffff" />
        <ellipse cx="25" cy="30.5" rx="5" ry="6" fill="#2e2a33" transform="rotate(-14 25 30.5)" />
        <ellipse cx="39" cy="30.5" rx="5" ry="6" fill="#2e2a33" transform="rotate(14 39 30.5)" />
        <circle cx="25.8" cy="29.5" r="1.6" fill="#fff" />
        <circle cx="38.2" cy="29.5" r="1.6" fill="#fff" />
        <ellipse cx="32" cy="38.5" rx="2.8" ry="2.2" fill="#2e2a33" />
        <path d="M32 40.6 q-1.5 2.2 -3.5 1.6 M32 40.6 q1.5 2.2 3.5 1.6" stroke="#2e2a33" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    ),
  },
  {
    id: 'rana',
    nombre: 'Rana',
    fondo: '#dff3d8',
    cuerpo: (
      <g>
        <circle cx="21.5" cy="18" r="7.2" fill="#58b368" />
        <circle cx="42.5" cy="18" r="7.2" fill="#58b368" />
        <circle cx="21.5" cy="17.5" r="4.6" fill="#fff" />
        <circle cx="42.5" cy="17.5" r="4.6" fill="#fff" />
        <circle cx="21.5" cy="17.8" r="2.3" fill={OJO} />
        <circle cx="42.5" cy="17.8" r="2.3" fill={OJO} />
        <ellipse cx="32" cy="37" rx="18" ry="14.5" fill="#58b368" />
        <circle cx="20" cy="39" r="3" fill="#f9a8c4" opacity="0.85" />
        <circle cx="44" cy="39" r="3" fill="#f9a8c4" opacity="0.85" />
        <path d="M23 39 q9 7 18 0" stroke="#2e7d43" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <circle cx="29" cy="31.5" r="1.1" fill="#2e7d43" />
        <circle cx="35" cy="31.5" r="1.1" fill="#2e7d43" />
      </g>
    ),
  },
];

// Hash estable (FNV-1a) → el mismo correo siempre obtiene el mismo animal.
export function indiceAvatar(semilla = '') {
  const texto = String(semilla);
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % ANIMALES.length;
}

export function animalDe(semilla = '') {
  return ANIMALES[indiceAvatar(semilla)];
}

export default function AvatarAnimal({ semilla = '', indice, size = 40, className = '', style }) {
  const animal =
    indice !== undefined
      ? ANIMALES[((indice % ANIMALES.length) + ANIMALES.length) % ANIMALES.length]
      : animalDe(semilla);

  return (
    <span
      className={`avatar ${className}`.trim()}
      style={{ width: size, height: size, ...style }}
      title={animal.nombre}
      aria-label={`Avatar de ${animal.nombre}`}
      role="img"
    >
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
        <circle cx="32" cy="32" r="32" fill={animal.fondo} />
        {animal.cuerpo}
      </svg>
    </span>
  );
}
