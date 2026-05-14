# Cursor agents

Referenciar agentes definidos en `ai-specs/.agents/`.
## Regla de núcleo del producto

En MUBER, el núcleo del producto está definido por:
- inventario
- tracking

Toda mejora que toque el núcleo debe:
- persistir en Supabase como backend real
- reflejarse en frontend
- validarse en TEST antes de cualquier paso a REAL
- mantener compatibilidad con User, Assisted, Driver, tracking y pagos

Regla práctica:
si inventario o tracking no están operativos, el núcleo no está completo.