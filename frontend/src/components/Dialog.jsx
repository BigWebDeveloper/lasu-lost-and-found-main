import { useEffect } from "react";
import { X } from "lucide-react";

function Dialog({ title, onClose, children, className = "" }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.classList.add("dialog-open");
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.classList.remove("dialog-open");
    };
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-label={title} aria-modal="true" className={`dialog ${className}`} role="dialog">
        <header className="dialog-header">
          <span>{title}</span>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button"><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default Dialog;
