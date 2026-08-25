# AGENTS.md

## Reglas de trabajo para este repositorio

- **Siempre commit + push después de cada cambio**: cuando el usuario pida una modificación y yo la termine de implementar (y verifique que compila/pasa el typecheck), debo hacer `git add`, `git commit` y `git push` automáticamente para que Railway se redespliegue. No esperar a que el usuario lo pida.

- **Verificación antes de commitear**: correr `npx tsc --noEmit` y, si aplica, el lint, para confirmar que los cambios están correctos.

- **Deploy**: este repo se despliega en Railway desde GitHub (rama `main`). Un push de `main` dispara el redeploy.