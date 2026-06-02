/**
 * EduIA — Main — inicialização do sistema
 * Dashboard de Identificacao de Dificuldades de Aprendizagem
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ INIT ═══════════════════════════════════════════════════════════════════
applyInterventionState();
initAuth();
document.querySelector('.school-badge b').textContent = CFG.escola;
render();