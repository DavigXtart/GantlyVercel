# 🔄 Cambiar entre Repositorios

## Opción 1: Cambiar el remoto principal (volver al antiguo)

Si en algún momento quieres volver a trabajar con el repositorio antiguo:

```bash
# Cambiar el remoto a Davvigar
git remote set-url origin https://github.com/Davvigar/PsyMatch.git

# Verificar que cambió
git remote -v

# Hacer push
git push -u origin main
```

## Opción 2: Tener ambos remotos configurados (RECOMENDADO)

Puedes tener ambos repositorios configurados y elegir a cuál hacer push:

```bash
# Agregar el repositorio antiguo como remoto adicional
git remote add old-origin https://github.com/Davvigar/PsyMatch.git

# Ver todos los remotos
git remote -v
```

Esto te dará:
- `origin` → DavigXtart/GantlyVercel (actual)
- `old-origin` → Davvigar/PsyMatch (antiguo)

### Usar ambos remotos:

```bash
# Push al nuevo repositorio (DavigXtart)
git push origin main

# Push al repositorio antiguo (Davvigar)
git push old-origin main

# Push a ambos a la vez
git push origin main && git push old-origin main
```

## Opción 3: Cambiar temporalmente

Si solo quieres hacer push al antiguo una vez:

```bash
# Push directo sin cambiar el remoto
git push https://github.com/Davvigar/PsyMatch.git main
```

---

## ⚠️ Importante

- **El historial local** siempre está completo (todos los commits)
- **Cambiar el remoto** solo afecta a dónde se envían los commits
- **Puedes cambiar** entre repositorios cuando quieras
- **Nunca pierdes** el historial local

---

## 📝 Estado Actual

- **Remoto actual**: `DavigXtart/GantlyVercel`
- **Repositorio antiguo**: `Davvigar/PsyMatch` (sigue existiendo con todo el historial)

