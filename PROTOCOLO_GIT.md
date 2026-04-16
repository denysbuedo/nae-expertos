# Protocolo para Subir Cambios a GitHub por Consola

Este documento establece el estándar paso a paso para guardar y subir (push) correctamente tus cambios de código al repositorio remoto en GitHub desde la consola.

## 1. Verificar el estado actual (Opcional pero recomendado)
Antes de crear un commit, siempre es buena práctica verificar qué archivos has modificado.
```bash
git status
```
*Esto te mostrará en rojo los archivos modificados y no rastreados.*

## 2. Preparar los cambios (Staging)
Agrega todos los archivos nuevos, modificados y eliminados al área de preparación (staging).
```bash
git add .
```
*(Puedes correr `git status` nuevamente; ahora verás los archivos listados en verde, lo que indica que están listos para empacarse).*

## 3. Crear el Commit
Empaqueta los cambios con un mensaje claro y descriptivo. Un buen mensaje ayuda a entender qué se modificó sin tener que leer el código.
```bash
git commit -m "feat: agrega campo teléfono y tipo a los perfiles de la bolsa de expertos"
```
*Convenciones recomendadas para el mensaje:*
- `feat:` para nuevas funcionalidades.
- `fix:` para solución de errores.
- `docs:` para actualizaciones en la documentación o Readme.
- `refactor:` para cambios en el código que no agregan funciones ni arreglan errores.

## 4. Subir los cambios a GitHub (Push)
Sube tu paquete de cambios (commit) al repositorio en GitHub en la rama correspondiente (usualmente `main` o `master`).
```bash
git push origin main
```
*(Si estás trabajando en otra rama, reemplaza `main` por el nombre de tu rama actual).*

---

### Solución de problemas comunes

- **Cambios rechazados ("fetch first" o "non-fast-forward")**: Esto significa que alguien más, o tú mismo desde otra computadora, subió cambios a GitHub. Debes descargar e integrar esos cambios primero:
  ```bash
  git pull origin main
  ```
  *(Luego de solucionar posibles conflictos, vuelve a intentar hacer `git push`).*

- **Deshacer el "git add ."** antes de hacer commit:
  Si agregaste archivos por error:
  ```bash
  git reset
  ```

---

## Anexo: Trabajando con Ramas y Merge

Cuando tienes una funcionalidad nueva, es común desarrollarla en una rama diferente (ej. `feature/nueva-funcionalidad`) y luego fusionarla (merge) a la rama principal (`main`).

1. **Ubicarse en la rama principal:**
   ```bash
   git checkout main
   ```
2. **Asegurarse de tener la última versión de `main`:**
   ```bash
   git pull origin main
   ```
3. **Fusionar la rama de desarrollo hacia `main`:**
   ```bash
   git merge feature/nueva-funcionalidad
   ```
4. **Subir el código fusionado:**
   ```bash
   git push origin main
   ```

---

## Anexo: Versionamiento con Etiquetas (Tags)

Los "Tags" sirven para marcar puntos específicos en la historia de los repositorios como importantes. Generalmente se usan para determinar versiones (ej. `v1.0.0`).

1. **Crear un tag local:**
   Usa un mensaje descriptivo para la versión.
   ```bash
   git tag -a v1.0.0 -m "Lanzamiento de la versión 1.0.0: Gestión de expertos y perfiles"
   ```
2. **Subir el tag a GitHub:**
   A diferencia de los commits normales, los tags no se suben solos con `git push`.
   ```bash
   git push origin v1.0.0
   ```
   *(Si deseas subir todos los tags de una vez, puedes usar `git push origin --tags`).*

---

## Anexo: Crear un Release (Lanzamiento) desde Consola

Un "Release" en GitHub está basado en un "Tag", pero incluye descripciones más elaboradas, notas de lanzamiento y/o binarios pre-compilados.

Para hacer esto de forma 100% nativa en consola, necesitas tener instalada la [GitHub CLI (`gh`)](https://cli.github.com/).

### Usando GitHub CLI (`gh`)
1. **Autenticarse (solo la primera vez):**
   ```bash
   gh auth login
   ```
2. **Crear el release apuntando a tu tag:**
   ```bash
   gh release create v1.0.0 --title "Versión 1.0.0 - Estable" --notes "Se implementaron las funcionalidades completas de la Bolsa de Expertos."
   ```
*(Si lo prefieres, también puedes ejecutar solo `gh release create v1.0.0` y la línea de comandos te guiará con un menú interactivo).*

> Si no cuentas con `gh`, los releases pueden crearse fácilmente desde el sitio web de GitHub, navegando a la sección **Releases** en tu repositorio, seleccionando "Draft a new release" y escogiendo el Tag de la versión (`v1.0.0`) que empujaste en el anexo anterior.
