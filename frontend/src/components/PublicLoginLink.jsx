import React from "react";

/**
 * PublicLoginLink
 * Padroniza todos os links de "Entrar" da área pública para abrir `/login` em nova aba nativamente.
 */
export default function PublicLoginLink({
  className = "",
  children = "Entrar",
  onClick,
  ...props
}) {
  return (
    <a
      href="/login"
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
      aria-label={`${typeof children === "string" ? children : "Entrar"} (abre em nova aba)`}
      {...props}
    >
      {children}
    </a>
  );
}
