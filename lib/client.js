window.__ModuleLoader__.load({
  id: "dsh-blue-whale-maid",
  factory: () => {
    const module = { exports: {} };
    const exports = module.exports;
    const BASE = "/api/dsh-blue-whale-maid/assets?f=";
    const ROOT_ID = "dsh-blue-whale-maid-widget";
    const STYLE_ID = "dsh-blue-whale-maid-style";
    const STORAGE_KEY = "dsh-blue-whale-maid:position-v1";

    function clamp(value, minimum, maximum) {
      return Math.min(maximum, Math.max(minimum, value));
    }

    function readPosition() {
      try {
        const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
        if (value && Number.isFinite(value.x) && Number.isFinite(value.y)) return value;
      } catch {}
      return null;
    }

    function savePosition(element) {
      const rect = element.getBoundingClientRect();
      const maxX = Math.max(1, window.innerWidth - rect.width);
      const maxY = Math.max(1, window.innerHeight - rect.height);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          x: clamp(rect.left / maxX, 0, 1),
          y: clamp(rect.top / maxY, 0, 1),
        }));
      } catch {}
    }

    function applyPosition(element, saved) {
      if (!saved) {
        element.style.left = "auto";
        element.style.top = "auto";
        element.style.right = "18px";
        element.style.bottom = "12px";
        return;
      }
      const rect = element.getBoundingClientRect();
      const maxX = Math.max(0, window.innerWidth - rect.width);
      const maxY = Math.max(0, window.innerHeight - rect.height);
      element.style.right = "auto";
      element.style.bottom = "auto";
      element.style.left = Math.round(clamp(saved.x, 0, 1) * maxX) + "px";
      element.style.top = Math.round(clamp(saved.y, 0, 1) * maxY) + "px";
    }

    async function boot() {
      if (document.getElementById(ROOT_ID)) return;

      try {
        if (!document.getElementById(STYLE_ID)) {
          const response = await fetch(BASE + "widget.css");
          if (!response.ok) throw new Error("style request failed: " + response.status);
          const style = document.createElement("style");
          style.id = STYLE_ID;
          style.textContent = await response.text();
          document.head.appendChild(style);
        }

        const root = document.createElement("div");
        root.id = ROOT_ID;
        root.setAttribute("aria-label", "Blue whale maid");

        const character = document.createElement("img");
        character.className = "dsh-blue-whale-maid-character";
        character.src = BASE + "whale-maid.png";
        character.alt = "";
        character.draggable = false;
        root.appendChild(character);
        document.body.appendChild(root);

        const initialPosition = readPosition();
        window.requestAnimationFrame(() => applyPosition(root, initialPosition));

        let drag = null;
        character.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          const rect = root.getBoundingClientRect();
          root.style.right = "auto";
          root.style.bottom = "auto";
          root.style.left = rect.left + "px";
          root.style.top = rect.top + "px";
          character.setPointerCapture(event.pointerId);
          character.classList.add("is-dragging");
          drag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            left: rect.left,
            top: rect.top,
          };
        });

        character.addEventListener("pointermove", (event) => {
          if (!drag || event.pointerId !== drag.pointerId) return;
          const maxX = Math.max(0, window.innerWidth - root.offsetWidth);
          const maxY = Math.max(0, window.innerHeight - root.offsetHeight);
          root.style.left = Math.round(clamp(drag.left + event.clientX - drag.startX, 0, maxX)) + "px";
          root.style.top = Math.round(clamp(drag.top + event.clientY - drag.startY, 0, maxY)) + "px";
        });

        function finishDrag(event) {
          if (!drag || event.pointerId !== drag.pointerId) return;
          character.classList.remove("is-dragging");
          drag = null;
          savePosition(root);
        }
        character.addEventListener("pointerup", finishDrag);
        character.addEventListener("pointercancel", finishDrag);

        character.addEventListener("dblclick", () => {
          try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
          applyPosition(root, null);
        });

        let resizeFrame = 0;
        window.addEventListener("resize", () => {
          window.cancelAnimationFrame(resizeFrame);
          resizeFrame = window.requestAnimationFrame(() => applyPosition(root, readPosition()));
        });
      } catch (error) {
        console.warn("[dsh-blue-whale-maid] failed to mount:", error);
      }
    }

    exports.apply = () => {};
    exports.inject = ["slots"];
    boot();
    return module.exports;
  },
});
