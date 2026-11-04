import "./carryToCart.css";
import {
  BRAND_COLORS,
  animateAndRemove,
  bezier,
  celebrate,
  centerOf,
  easeInOutCubic,
  prefersReducedMotion,
  spawnAt,
  toTransform,
  waitForAnimation,
} from "./flyToCart";

// Efecto "el carrito viene por tu producto".
// Un carrito pequeño llega rodando al pie de la foto, la foto cae dentro de su
// canasta y el carrito vuela con su carga hasta el carrito del Header, que lo
// recibe con el mismo festejo de flyToCart (rebote, onda, chispas y "+1").
//
// Igual que flyToCart: es puramente visual, vive en <body> fuera de React y la
// promesa se resuelve al aterrizar, para sumar el producto justo en ese
// momento. Si no hay animacion posible (reducir movimiento, sin carrito en el
// Header) se resuelve de inmediato. Nunca se rechaza: el carrito no puede
// quedarse sin el producto por un error visual.

// El carrito mide 64x56 px (carryToCart.css) y su SVG usa esa misma escala
const CARGO_SIZE = 34; // px de la foto dentro de la canasta
// Centro de la canasta respecto al centro del carrito (mirando a la derecha)
const CARGO_OFFSET = { x: 5, y: -23 };
const ARRIVE_MS = 220;
const DROP_DELAY = 50;
const DROP_MS = 320;
const PATH_STEPS = 24;
const END_SCALE = 0.42; // tamaño al llegar, parecido al icono del Header

const CART_SVG = `
  <svg viewBox="0 0 64 56" aria-hidden="true">
    <path class="carry-courier-handle" d="M2 6h7l3 6" />
    <path class="carry-courier-basket" d="M12 12h50l-7 26H19z" />
    <path class="carry-courier-grid" d="M27 18l1 14M37 18v14M47 18l-1 14" />
    <g class="carry-courier-wheel">
      <circle cx="24" cy="47" r="6" />
      <path d="M24 43v8M20 47h8" />
    </g>
    <g class="carry-courier-wheel">
      <circle cx="50" cy="47" r="6" />
      <path d="M50 43v8M46 47h8" />
    </g>
  </svg>`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Punto de encuentro: al pie de la foto, siempre dentro de la pantalla
const meetingPoint = (rect) => ({
  x: clamp(rect.left + rect.width / 2, 60, window.innerWidth - 60),
  y: clamp(rect.bottom - 40, 70, window.innerHeight - 50),
});

function buildCourier(image, point, facingLeft) {
  const courier = document.createElement("div");
  courier.className = `carry-courier is-rolling${facingLeft ? " is-facing-left" : ""}`;
  courier.setAttribute("aria-hidden", "true");
  courier.style.left = `${point.x}px`;
  courier.style.top = `${point.y}px`;

  const body = document.createElement("div");
  body.className = "carry-courier-body";

  // La carga va antes que el SVG: asi la canasta tapa su parte de abajo y el
  // producto "asoma" por encima, como si estuviera adentro.
  const cargo = document.createElement("div");
  cargo.className = "carry-courier-cargo";
  const photo = document.createElement("img");
  photo.src = image.currentSrc || image.src;
  photo.alt = "";
  cargo.appendChild(photo);

  body.appendChild(cargo);
  body.insertAdjacentHTML("beforeend", CART_SVG);
  courier.appendChild(body);
  document.body.appendChild(courier);
  return { courier, body, cargo };
}

// 1. El carrito llega rodando desde un costado y frena con un pequeño rebote
function arrive(courier, facingLeft) {
  const from = facingLeft ? 60 : -60;
  return courier.animate(
    [
      { transform: `translateX(${from}px) scale(0.6)`, opacity: 0 },
      { transform: `translateX(${-from * 0.08}px) scale(1.04)`, opacity: 1, offset: 0.7 },
      { transform: "translateX(0px) scale(1)", opacity: 1 },
    ],
    { duration: ARRIVE_MS, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" }
  );
}

// 2. Una copia de la foto se despega, sube un poco y cae dentro de la canasta
function dropIntoBasket(image, rect, basket) {
  const clone = document.createElement("div");
  clone.className = "carry-drop";
  clone.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  const photo = document.createElement("img");
  photo.src = image.currentSrc || image.src;
  photo.alt = "";
  photo.style.objectFit = getComputedStyle(image).objectFit;
  clone.appendChild(photo);
  document.body.appendChild(clone);

  // La foto original se "aprieta" al soltar la copia
  image.animate(
    [{ transform: "scale(1)" }, { transform: "scale(0.96)" }, { transform: "scale(1)" }],
    { duration: 240, delay: DROP_DELAY, easing: "ease-out" }
  );

  const start = centerOf(rect);
  const dx = basket.x - start.x;
  const dy = basket.y - start.y;
  const endScale = CARGO_SIZE / Math.max(rect.width, rect.height);
  const liftScale = 1 + (endScale - 1) * 0.3;

  const drop = clone.animate(
    [
      {
        offset: 0,
        easing: "cubic-bezier(0.2, 0.8, 0.3, 1)",
        transform: "translate(0px, 0px) scale(1)",
        borderRadius: "4%",
      },
      {
        offset: 0.35,
        // Cae acelerando, como si tuviera peso
        easing: "cubic-bezier(0.55, 0, 0.85, 0.35)",
        transform: `translate(${(dx * 0.2).toFixed(1)}px, ${(dy * 0.2 - 28).toFixed(1)}px) scale(${liftScale.toFixed(3)})`,
        borderRadius: "10%",
      },
      {
        offset: 1,
        transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${endScale.toFixed(3)})`,
        borderRadius: "20%",
      },
    ],
    { duration: DROP_MS, delay: DROP_DELAY, fill: "forwards" }
  );

  return waitForAnimation(drop, DROP_DELAY + DROP_MS + 300).then(() => clone.remove());
}

// 3. El carrito "atrapa" la carga: se aplasta y la foto aparece en la canasta
function catchCargo(body, cargo) {
  cargo.style.opacity = "1";
  cargo.animate(
    [
      { transform: "translateY(-5px) scale(0.7)" },
      { transform: "translateY(2px) scale(1.1)", offset: 0.6 },
      { transform: "translateY(0px) scale(1)" },
    ],
    { duration: 180, easing: "ease-out" }
  );
  body.animate(
    [
      { transform: "scale(1, 1)" },
      { transform: "scale(1.08, 0.86)", offset: 0.35 },
      { transform: "scale(0.97, 1.04)", offset: 0.7 },
      { transform: "scale(1, 1)" },
    ],
    { duration: 200, easing: "ease-out" }
  );
}

// 4. Sube en curva y llega "planeando" al carrito del Header, con la nariz
// hacia arriba. El punto de control va a la altura del destino: el Header esta
// pegado al borde superior y un arco mas alto sacaria al carrito de la pantalla.
function flyToHeader(courier, from, to, facingLeft) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const duration = Math.round(clamp(320 + Math.hypot(dx, dy) * 0.32, 400, 680));
  const control = { x: dx * 0.35, y: dy };
  const tilt = facingLeft ? 10 : -10;

  const frames = [];
  for (let step = 0; step <= PATH_STEPS; step++) {
    const t = easeInOutCubic(step / PATH_STEPS);
    frames.push({
      offset: step / PATH_STEPS,
      transform: toTransform({
        x: bezier(0, control.x, dx, t),
        y: bezier(0, control.y, dy, t),
        scale: 1 + (END_SCALE - 1) * t,
        rotate: tilt * Math.sin(Math.PI * t),
      }),
    });
  }

  const flight = courier.animate(frames, { duration, easing: "linear", fill: "forwards" });
  startSparkTrail(courier, flight, duration, facingLeft);
  return { flight, duration };
}

// Estela de chispas de colores que salen de las ruedas mientras vuela
function startSparkTrail(courier, flight, duration, facingLeft) {
  let lastSpawn = 0;
  let count = 0;

  const tick = (now) => {
    if (flight.playState !== "running" || !courier.isConnected) return;
    const progress = (flight.currentTime || 0) / duration;
    if (progress > 0.05 && progress < 0.85 && now - lastSpawn > 40) {
      lastSpawn = now;
      const rect = courier.getBoundingClientRect();
      const spark = spawnAt("fly-to-cart-spark", {
        x: facingLeft ? rect.right - 8 : rect.left + 8,
        y: rect.bottom - 6,
      });
      spark.style.background = `var(${BRAND_COLORS[count++ % BRAND_COLORS.length]})`;
      const driftX = (facingLeft ? 1 : -1) * (10 + Math.random() * 16);
      animateAndRemove(
        spark,
        [
          { transform: "translate(0px, 0px) scale(1)", opacity: 0.9 },
          {
            transform: `translate(${driftX.toFixed(1)}px, ${(8 + Math.random() * 14).toFixed(1)}px) scale(0.2)`,
            opacity: 0,
          },
        ],
        { duration: 500, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" }
      );
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// 5. Se funde dentro del carrito del Header
function absorb(courier) {
  const fade = courier.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 140,
    easing: "ease-in",
    fill: "forwards",
  });
  waitForAnimation(fade, 350).then(() => courier.remove());
}

export async function carryToCart(image) {
  const target = document.querySelector("[data-cart-target]");
  if (!image || !target || !image.animate || prefersReducedMotion()) return;

  const imageRect = image.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (!imageRect.width || !targetRect.width) return;

  const meet = meetingPoint(imageRect);
  const end = centerOf(targetRect);
  // El carrito mira hacia donde va a viajar
  const facingLeft = end.x < meet.x - 40;
  const basket = {
    x: meet.x + (facingLeft ? -CARGO_OFFSET.x : CARGO_OFFSET.x),
    y: meet.y + CARGO_OFFSET.y,
  };

  let courier;
  try {
    const parts = buildCourier(image, meet, facingLeft);
    courier = parts.courier;

    arrive(courier, facingLeft);
    await dropIntoBasket(image, imageRect, basket);
    catchCargo(parts.body, parts.cargo);
    await wait(80);

    const { flight, duration } = flyToHeader(courier, meet, end, facingLeft);
    await waitForAnimation(flight, duration + 350);

    absorb(courier);
    celebrate(target);
  } catch {
    courier?.remove();
  }
}
