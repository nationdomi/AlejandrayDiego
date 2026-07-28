/* Alejandra & Diego — interacciones */

/* ============================================================
   CONFIGURACIÓN (ver README.md)
   ============================================================ */
const DRIVE_FOLDER_ID = "1-jUoSLBWdCVIJQK2pyWdvdwGP2EF4dJO";
const DRIVE_API_KEY = ""; // ← API key de Google Cloud para el slideshow
const SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwnH5BkvI9R7j1-oYZ0IBqDYF7UotgtJKCjD_F6tikzzVte1YnPsCnMeDEaJR8SxEcX/exec"; // ← URL del Apps Script para RSVP en Google Sheets
const WEDDING_DATE = new Date("2026-10-17T16:30:00-05:00"); // Manta (UTC-5)

/* ============================================================
   PANTALLA DE CARGA + ENTRADA ESCALONADA DEL HERO
   ============================================================ */
(function () {
  const loader = document.getElementById("loader");
  let done = false;
  function reveal() {
    if (done) return;
    done = true;
    document.body.classList.add("entered");
    if (loader) {
      loader.classList.add("hide");
      setTimeout(() => loader.remove(), 900);
    }
  }
  if (!loader) {
    /* páginas sin loader: entrada inmediata */
    requestAnimationFrame(() => document.body.classList.add("entered"));
    return;
  }
  if (document.readyState === "complete") {
    setTimeout(reveal, 400); /* que se aprecie el monograma un instante */
  } else {
    window.addEventListener("load", () => setTimeout(reveal, 400));
  }
  setTimeout(reveal, 3000); /* tope: nunca más de 3s de espera */
})();

/* ============================================================
   CUENTA REGRESIVA
   ============================================================ */
(function () {
  const box = document.getElementById("countdown");
  if (!box) return;
  const msg = document.getElementById("cd-msg");
  const el = {
    d: document.getElementById("cd-d"),
    h: document.getElementById("cd-h"),
    m: document.getElementById("cd-m"),
    s: document.getElementById("cd-s"),
  };
  const DAY = 86400000;
  function tick() {
    const now = Date.now();
    const diff = WEDDING_DATE.getTime() - now;
    if (diff > 0) {
      el.d.textContent = Math.floor(diff / DAY);
      el.h.textContent = String(Math.floor((diff % DAY) / 3600000)).padStart(2, "0");
      el.m.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      el.s.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      return true;
    }
    box.hidden = true;
    msg.hidden = false;
    msg.textContent =
      now - WEDDING_DATE.getTime() < DAY ? "¡Hoy es el gran día!" : "¡Vivan los novios!";
    return false;
  }
  if (tick()) {
    const t = setInterval(() => { if (!tick()) clearInterval(t); }, 1000);
  }
})();

/* ============================================================
   RSVP → GOOGLE SHEETS (con FormSubmit como respaldo)
   ============================================================ */
(function () {
  const form = document.querySelector(".rsvp-form");
  if (!form || !SHEETS_WEBAPP_URL) return; /* sin URL: sigue por FormSubmit */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector(".btn-submit");
    const label = btn.querySelector("span") || btn;
    const original = label.textContent;
    btn.disabled = true;
    label.textContent = "Enviando...";
    try {
      await fetch(SHEETS_WEBAPP_URL, {
        method: "POST",
        mode: "no-cors",
        body: new FormData(form),
      });
      window.location.href = "gracias.html";
    } catch (err) {
      btn.disabled = false;
      label.textContent = original;
      alert("No pudimos enviar tu confirmación. Por favor intentá de nuevo.");
    }
  });
})();

(async function galeriaDrive() {
  const show = document.getElementById("slideshow");
  if (!show || !DRIVE_API_KEY) return;

  try {
    const q = encodeURIComponent(
      `'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`
    );
    const url =
      `https://www.googleapis.com/drive/v3/files?q=${q}` +
      `&key=${DRIVE_API_KEY}` +
      `&fields=files(id,name)&pageSize=100&orderBy=createdTime desc`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Drive API " + res.status);
    const data = await res.json();
    const files = (data.files || []).slice(0, 60);
    if (!files.length) return; // sin fotos aún: queda el estado vacío

    const slides = document.getElementById("slides");
    const dots = document.getElementById("slide-dots");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    files.forEach((f, i) => {
      const slide = document.createElement("div");
      slide.className = "slide" + (i === 0 ? " active" : "");
      const img = document.createElement("img");
      img.alt = "Foto compartida por los invitados";
      img.loading = i < 2 ? "eager" : "lazy";
      img.src = `https://drive.google.com/thumbnail?id=${f.id}&sz=w1200`;
      slide.appendChild(img);
      slides.appendChild(slide);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Foto ${i + 1} de ${files.length}`);
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => goTo(i, true));
      dots.appendChild(dot);
    });

    document.getElementById("gallery-empty").hidden = true;
    show.hidden = false;
    const count = document.getElementById("gallery-count");
    count.hidden = false;
    count.textContent =
      files.length === 1 ? "1 recuerdo compartido" : `${files.length} recuerdos compartidos`;

    let idx = 0;
    let timer = null;
    const all = slides.querySelectorAll(".slide");
    const allDots = dots.querySelectorAll("button");

    function goTo(i, manual) {
      all[idx].classList.remove("active");
      allDots[idx].classList.remove("active");
      idx = (i + files.length) % files.length;
      all[idx].classList.add("active");
      allDots[idx].classList.add("active");
      if (manual) restart();
    }
    function restart() {
      if (reduced) return;
      clearInterval(timer);
      timer = setInterval(() => goTo(idx + 1), 4500);
    }

    document.getElementById("slide-prev").addEventListener("click", () => goTo(idx - 1, true));
    document.getElementById("slide-next").addEventListener("click", () => goTo(idx + 1, true));
    show.addEventListener("mouseenter", () => clearInterval(timer));
    show.addEventListener("mouseleave", restart);

    /* Swipe táctil */
    let x0 = null;
    show.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    show.addEventListener(
      "touchend",
      (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) goTo(idx + (dx < 0 ? 1 : -1), true);
        x0 = null;
      },
      { passive: true }
    );

    restart();
  } catch (err) {
    console.warn("Galería de Drive no disponible:", err);
    /* queda el estado vacío, sin romper la página */
  }
})();

/* Revelado al hacer scroll */
(function () {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
})();

/* Scrollspy: resalta la sección activa en la nav de la guía */
(function () {
  const nav = document.querySelector(".guia-nav");
  if (!nav) return;
  const links = Array.from(nav.querySelectorAll("a[href^='#']"));
  const sections = links
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const setActive = (id) => {
    links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
    const active = nav.querySelector("a.active");
    if (active) active.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  };

  const spy = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) setActive(visible[0].target.id);
    },
    { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5] }
  );
  sections.forEach((s) => spy.observe(s));
})();

/* Copiar datos bancarios */
document.querySelectorAll(".copyable").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy || btn.querySelector("span").textContent.trim();
    try {
      await navigator.clipboard.writeText(value);
    } catch (e) {
      /* fallback para navegadores viejos */
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    const hint = btn.querySelector(".copy-hint");
    const original = hint.textContent;
    hint.textContent = "¡Copiado!";
    btn.classList.add("copied");
    setTimeout(() => {
      hint.textContent = original;
      btn.classList.remove("copied");
    }, 2000);
  });
});

// Mostrar campo de alergias solo si confirman asistencia
const attendanceSelect = document.getElementById('attendance');
const alergiasField = document.getElementById('campo-alergias');
const alergiasInput = document.getElementById('alergias');

if (attendanceSelect && alergiasField) {
  attendanceSelect.addEventListener('change', function() {
    if (this.value === 'Sí, asistiré con gusto') {
      alergiasField.style.display = 'block';
    } else {
      alergiasField.style.display = 'none';
      alergiasInput.value = ''; // Borramos lo escrito si cambian de opinión y no van
    }
  });
}
