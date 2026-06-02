/**
 * EduIA — Dados — turmas, alunos e intervencoes
 * TCC — Engenharia de Software, UNDB — Sao Luis/MA
 * Autor: Wesley Matheus Martins Aguiar
 */

// ══ DADOS ══════════════════════════════════════════════════════════════════
const TURMAS = {
  '7A': { total:32, alto:8, medio:13, baixo:11,
    alunos: [
      { id:'7A-1', nome:'Lucas Mendes',   init:'LM', cor:'#ff4d6d', bg:'rgba(255,77,109,.15)', risco:'alto',  prob:91, freq:61, mat:32, port:28, rep:2, shap:[42,31,15,12], int:'Contato imediato com a familia sobre a frequencia. Reforco urgente em matematica 3x/semana. Acionar assistente social da escola.', status:'pendente',  prog:10, hist:[] },
      { id:'7A-2', nome:'Beatriz Santos', init:'BS', cor:'#ff4d6d', bg:'rgba(255,77,109,.15)', risco:'alto',  prob:88, freq:65, mat:29, port:33, rep:1, shap:[38,34,17,11], int:'Verificar situacao domiciliar. Inserir em programa de tutoria. Reforco em matematica.', status:'andamento', prog:40, hist:['Reuniao com mae realizada em 10/04','Matriculado no grupo de reforco em 14/04'] },
      { id:'7A-3', nome:'Ana Paula',      init:'AP', cor:'#ff4d6d', bg:'rgba(255,77,109,.15)', risco:'alto',  prob:84, freq:70, mat:41, port:35, rep:1, shap:[30,38,20,12], int:'Reforco em portugues e matematica 2x/semana. Avaliacao com pedagogo.', status:'andamento', prog:60, hist:['Avaliacao pedagogica agendada','Reforco iniciado em 08/04'] },
      { id:'7A-4', nome:'Carlos Rocha',   init:'CR', cor:'#f5a623', bg:'rgba(245,166,35,.15)', risco:'medio', prob:67, freq:78, mat:55, port:60, rep:0, shap:[25,32,28,15], int:'Acompanhamento bimestral. Atividades complementares para casa.', status:'pendente',  prog:0,  hist:[] },
      { id:'7A-5', nome:'Felipe Torres',  init:'FT', cor:'#f5a623', bg:'rgba(245,166,35,.15)', risco:'medio', prob:58, freq:82, mat:62, port:57, rep:0, shap:[20,35,28,17], int:'Monitorar desempenho em matematica. Exercicios complementares semanais.', status:'andamento', prog:30, hist:['Lista de exercicios enviada em 12/04'] },
      { id:'7A-6', nome:'Camila Nunes',   init:'CN', cor:'#2dd4a0', bg:'rgba(45,212,160,.15)', risco:'baixo', prob:18, freq:94, mat:78, port:74, rep:0, shap:[10,45,28,17], int:'Sem intervencao necessaria. Monitoramento regular bimestral.', status:'concluida', prog:100, hist:['Avaliacao concluida — sem risco identificado'] },
      { id:'7A-7', nome:'Rafael Lima',    init:'RL', cor:'#2dd4a0', bg:'rgba(45,212,160,.15)', risco:'baixo', prob:12, freq:96, mat:82, port:80, rep:0, shap:[ 8,48,26,18], int:'Desempenho satisfatorio. Atividades de aprofundamento sugeridas.', status:'concluida', prog:100, hist:['Avaliacao concluida — desempenho excelente'] },
    ],
    shap:[{l:'Frequencia escolar',v:38,c:'var(--red)'},{l:'Nota matematica',v:31,c:'var(--amber)'},{l:'Nota portugues',v:18,c:'var(--blue)'},{l:'Reprovacoes ant.',v:13,c:'var(--muted)'}]
  },
  '8B': { total:28, alto:5, medio:11, baixo:12,
    alunos: [
      { id:'8B-1', nome:'Mariana Lopes',  init:'ML', cor:'#ff4d6d', bg:'rgba(255,77,109,.15)', risco:'alto',  prob:79, freq:68, mat:38, port:42, rep:1, shap:[40,29,18,13], int:'Contato com familia. Reforco em matematica e leitura 2x/semana.', status:'pendente',  prog:5,   hist:[] },
      { id:'8B-2', nome:'Thiago Barbosa', init:'TB', cor:'#ff4d6d', bg:'rgba(255,77,109,.15)', risco:'alto',  prob:75, freq:72, mat:31, port:36, rep:2, shap:[35,36,18,11], int:'Inserir em grupo de reforco. Reuniao com familia e pedagogo.', status:'andamento', prog:45,  hist:['Reuniao realizada em 11/04','Reforco iniciado'] },
      { id:'8B-3', nome:'Diego Ferreira', init:'DF', cor:'#f5a623', bg:'rgba(245,166,35,.15)', risco:'medio', prob:63, freq:80, mat:52, port:55, rep:0, shap:[28,32,24,16], int:'Monitoramento mensal. Material de apoio para casa.', status:'andamento', prog:50,  hist:['Material enviado em 09/04'] },
      { id:'8B-4', nome:'Sofia Alves',    init:'SA', cor:'#f5a623', bg:'rgba(245,166,35,.15)', risco:'medio', prob:55, freq:83, mat:58, port:61, rep:0, shap:[22,34,26,18], int:'Acompanhar evolucao bimestral.', status:'pendente',  prog:0,   hist:[] },
      { id:'8B-5', nome:'Gabriela Costa', init:'GC', cor:'#2dd4a0', bg:'rgba(45,212,160,.15)', risco:'baixo', prob:20, freq:92, mat:75, port:77, rep:0, shap:[10,44,28,18], int:'Desempenho satisfatorio.', status:'concluida', prog:100, hist:['Avaliacao concluida'] },
    ],
    shap:[{l:'Frequencia escolar',v:42,c:'var(--red)'},{l:'Nota matematica',v:28,c:'var(--amber)'},{l:'Nota portugues',v:20,c:'var(--blue)'},{l:'Reprovacoes ant.',v:10,c:'var(--muted)'}]
  },
  '9C': { total:30, alto:6, medio:10, baixo:14,
    alunos: [
      { id:'9C-1', nome:'Renata Oliveira', init:'RO', cor:'#ff4d6d', bg:'rgba(255,77,109,.15)', risco:'alto',  prob:93, freq:59, mat:27, port:30, rep:2, shap:[44,32,14,10], int:'URGENTE: Acionar assistencia social e pedagogo. Contato com familia hoje.', status:'pendente',  prog:0,   hist:[] },
      { id:'9C-2', nome:'Eduardo Klein',   init:'EK', cor:'#ff4d6d', bg:'rgba(255,77,109,.15)', risco:'alto',  prob:86, freq:66, mat:35, port:31, rep:1, shap:[38,35,16,11], int:'Reforco em matematica e portugues. Contato com familia.', status:'andamento', prog:25,  hist:['Contato com responsavel realizado em 15/04'] },
      { id:'9C-3', nome:'Bruno Viana',     init:'BV', cor:'#f5a623', bg:'rgba(245,166,35,.15)', risco:'medio', prob:64, freq:77, mat:52, port:58, rep:0, shap:[26,33,25,16], int:'Monitoramento quinzenal. Reforco em matematica.', status:'andamento', prog:55,  hist:['Reforco iniciado em 07/04','1a avaliacao realizada'] },
      { id:'9C-4', nome:'Leticia Neves',   init:'LN', cor:'#f5a623', bg:'rgba(245,166,35,.15)', risco:'medio', prob:57, freq:80, mat:58, port:54, rep:0, shap:[22,35,26,17], int:'Acompanhar. Material extra de portugues.', status:'pendente',  prog:0,   hist:[] },
      { id:'9C-5', nome:'Camila Zanetti',  init:'CZ', cor:'#2dd4a0', bg:'rgba(45,212,160,.15)', risco:'baixo', prob:15, freq:95, mat:80, port:76, rep:0, shap:[ 8,46,28,18], int:'Desempenho excelente. Sem intervencao necessaria.', status:'concluida', prog:100, hist:['Avaliacao concluida — excelente desempenho'] },
    ],
    shap:[{l:'Frequencia escolar',v:35,c:'var(--red)'},{l:'Nota matematica',v:33,c:'var(--amber)'},{l:'Nota portugues',v:22,c:'var(--blue)'},{l:'Reprovacoes ant.',v:10,c:'var(--muted)'}]
  }
};

// Config state
const CFG = { alertas: true, relatorioAuto: false, ciclo: 14, notifEmail: true };

let CT='7A', SEL=null, CD=null, CP=null, FA='todos', EXP=null;