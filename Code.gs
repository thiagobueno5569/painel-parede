/**
 * ASSISTENTE DE PAREDE — Galaxy Tab S3
 * ------------------------------------------------------------
 * - Lê seus e-mails a cada 15 min e adiciona compromissos ao Google Agenda
 *   (convites .ics, e-mails de consulta/reunião/voo/reserva etc.)
 * - Lê os e-mails da FACULDADE e coloca na agenda "Faculdade":
 *   provas, entregas/atividades, aulas canceladas e aulas extras/reposições
 * - Monta o resumo do dia: clima, agenda, e-mails importantes, notícias
 * - Serve a tela do tablet (Index.html) e fala o resumo em voz alta
 *
 * Depois de colar, rode a função setup() uma vez.
 */

// ===================== CONFIGURE AQUI =====================
const CONFIG = {
  NOME: 'Thiago',               // como o assistente te chama
  CIDADE: 'São João del Rei',
  LAT: -21.1356,
  LON: -44.2617,
  HORA_ACORDAR: '07:00',        // a partir daqui: quadros + resumo falado quando você passar
  HORA_NOITE: '19:00',          // a partir daqui: modo noite (estrelas, lua e horário bem fraquinho)
  DESLOCAMENTO_MIN: 55,         // em geral você sai de casa ~55 min antes da aula
  // aulas do começo da tarde: você sai antes (almoço no campus) — janela de saída fixa
  SAIDA_TARDE: { aulasDe: '12:00', aulasAte: '14:00', sairDe: '11:20', sairAte: '11:30' },
  LEVAR: ['Caderno', 'Calculadora', 'Carregador', 'Garrafa de água', 'Chaves'],   // lembrete na hora de sair

  // ---------- AULAS (atestado de matrícula 2026.2) ----------
  // dia: 0 = domingo, 1 = segunda … 6 = sábado
  PERIODO: { inicio: '2026-08-10', fim: '2026-12-19' },
  AULAS: [
    { cod: 'EL00623502', nome: 'Álgebra Linear', curto: 'Álgebra Linear', prof: 'Andreia Malacarne Bueno',
      local: 'CSA · Pavilhão, sala 2.10/2.11', sala: 'sala 2.10', cor: '#7f97b8',
      horarios: [{ dia: 2, ini: '08:00', fim: '09:50' }, { dia: 4, ini: '10:00', fim: '11:50' }] },
    { cod: 'EL01223500', nome: 'Cálculo Vetorial', curto: 'Cálculo Vetorial', prof: 'Edno Alan Pereira',
      local: 'CSA · Pavilhão, sala 2.05/2.06', sala: 'sala 2.05', cor: '#8fa98a',
      horarios: [{ dia: 1, ini: '13:15', fim: '15:05' }, { dia: 3, ini: '13:15', fim: '15:05' }] },
    { cod: 'EL01523508', nome: 'Equações Diferenciais', curto: 'Eq. Diferenciais', prof: 'Ronaldo Ribeiro Alves',
      local: 'CSA · Pavilhão, sala 2.05/2.06', sala: 'sala 2.05', cor: '#c8835f',
      horarios: [{ dia: 2, ini: '15:15', fim: '17:05' }, { dia: 4, ini: '13:15', fim: '15:05' }] },
    { cod: 'QU00719711', nome: 'Fundamentos de Mecânica Clássica', curto: 'Mecânica Clássica', prof: 'Alfredo Vinicius Andrade Guimarães',
      local: 'DCNAT · sala A-3.09', sala: 'sala A 3.09', cor: '#a690b5',
      horarios: [{ dia: 2, ini: '19:00', fim: '20:50' }, { dia: 3, ini: '21:00', fim: '22:50' }] },
    { cod: 'EL01723510', nome: 'Mecânica dos Sólidos', curto: 'Mec. dos Sólidos', prof: 'Luan Carrera Santos',
      local: 'CSA · Pavilhão, sala 2.05/2.06', sala: 'sala 2.05', cor: '#cdaa60',
      horarios: [{ dia: 5, ini: '13:15', fim: '15:05' }] }
  ],

  // ---------- REMÉDIOS ----------
  // Dá para cadastrar e editar pelo próprio tablet (botão "Remédios"). Esta lista só vale até lá.
  REMEDIOS: [],
  GEMINI_API_KEY: '',           // opcional (aistudio.google.com) — deixa a leitura dos e-mails bem mais esperta
  GEMINI_MODELO: 'gemini-2.5-flash',
  MARCADOR: 'Assistente/Lido',  // marcador posto nos e-mails já analisados
  DIAS_EMAIL: 3,                // analisa e-mails dos últimos X dias
  NOTICIAS: 4,

  // ---------- FACULDADE ----------
  FACULDADE: {
    // quem manda os e-mails da faculdade: domínios ou endereços (ajuste para os seus!)
    REMETENTES: ['ufsj.edu.br', 'classroom.google.com'],
    NOME_AGENDA: 'Faculdade',     // agenda própria, criada sozinha no seu Google Agenda
    MARCADOR: 'Assistente/Faculdade',
    DIAS: 14,                     // analisa e-mails dos últimos X dias
    // também copia os eventos para estas agendas. Aceita 'principal' (a agenda do seu Gmail),
    // o NOME de uma agenda (ex.: 'Estudos') ou o ID. Deixe [] para usar só a agenda Faculdade.
    COPIAR_PARA: ['principal']
  }
};
// ==========================================================

const TZ = 'America/Sao_Paulo';
const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// ---------------------------------------------------------- setup / web app

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('rotina').timeBased().everyMinutes(15).create();
  marcador_();
  agendaFaculdade_();
  tentar_(criarAulasNaAgenda);
  listarAgendas();
  Logger.log('Gmail conectado: ' + Session.getActiveUser().getEmail() + ' (o script lê a caixa desta conta)');
  const props = PropertiesService.getScriptProperties();
  let k = props.getProperty('CHAVE');
  if (!k) {
    k = Utilities.getUuid().replace(/-/g, '').slice(0, 16);
    props.setProperty('CHAVE', k);
  }
  rotina();
  Logger.log('Teste do resumo: ' + getBriefing().fala);
  Logger.log('========================================');
  Logger.log('SUA CHAVE DO TABLET: ' + k);
  Logger.log('No tablet, abra:  <URL do app da Web>?k=' + k);
  Logger.log('========================================');
}

function doGet(e) {
  const k = PropertiesService.getScriptProperties().getProperty('CHAVE');
  if (!k || !e || !e.parameter || e.parameter.k !== k) {
    return HtmlService.createHtmlOutput('<h2 style="font-family:sans-serif">Acesso negado</h2>');
  }
  if (e.parameter.formato === 'json') {
    if (e.parameter.escanear === '1') rotina();
    let r;
    try {
      r = api_(e.parameter.acao || '', e.parameter.p ? JSON.parse(e.parameter.p) : {});
    } catch (err) {
      r = { erro: String(err) };
    }
    return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
  }
  const t = HtmlService.createTemplateFromFile('Index');
  t.horaAcordar = CONFIG.HORA_ACORDAR;
  t.horaDormir = CONFIG.HORA_NOITE;
  t.k = k;
  return t.evaluate()
    .setTitle('Assistente')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function checarChave_(k) {
  if (k !== PropertiesService.getScriptProperties().getProperty('CHAVE')) throw new Error('Acesso negado');
}

/** Chamado pela tela do tablet */
function dadosTablet(k) {
  checarChave_(k);
  return getBriefing();
}

/** Botão "verificar e-mails agora" do tablet */
function escanearAgora(k) {
  checarChave_(k);
  rotina();
  return getBriefing();
}

/** Todas as ações do tablet passam por aqui (google.script.run ou ?formato=json&acao=…) */
function apiTablet(k, acao, p) {
  checarChave_(k);
  return api_(acao || '', p || {});
}

function api_(acao, p) {
  if (acao === 'escanear') rotina();
  else if (acao === 'tomei') marcarRemedio_(p.id, p.hora, true);
  else if (acao === 'desfazer') marcarRemedio_(p.id, p.hora, false);
  else if (acao === 'remedios') salvarRemedios_(p.lista);
  return getBriefing();
}

// ---------------------------------------------------------- REMÉDIOS

function listaRemedios_() {
  const s = PropertiesService.getScriptProperties().getProperty('REMEDIOS');
  return s ? JSON.parse(s) : CONFIG.REMEDIOS;
}

function salvarRemedios_(lista) {
  if (!Array.isArray(lista)) throw new Error('lista inválida');
  const limpa = lista.slice(0, 20).map(function (r, i) {
    const horas = (Array.isArray(r.horas) ? r.horas : String(r.horas || '').split(/[,;\s]+/))
      .map(function (h) { const m = String(h).match(/^(\d{1,2})[:h]?(\d{2})?$/); return m && +m[1] < 24 ? ('0' + m[1]).slice(-2) + ':' + (m[2] || '00') : null; })
      .filter(function (h) { return h; }).sort();
    return {
      id: String(r.id || ('r' + Date.now().toString(36) + i)).slice(0, 24),
      nome: String(r.nome || '').trim().slice(0, 60),
      dose: String(r.dose || '').trim().slice(0, 60),
      horas: horas
    };
  }).filter(function (r) { return r.nome && r.horas.length; });
  PropertiesService.getScriptProperties().setProperty('REMEDIOS', JSON.stringify(limpa));
}

function hojeIso_(d) { return Utilities.formatDate(d || new Date(), TZ, 'yyyy-MM-dd'); }

function tomados_() {
  const s = PropertiesService.getScriptProperties().getProperty('TOMADOS');
  return s ? JSON.parse(s) : {};
}

function marcarRemedio_(id, hora, tomou) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const t = tomados_(), dia = hojeIso_();
    t[dia] = t[dia] || {};
    if (tomou) t[dia][id + '@' + hora] = Date.now(); else delete t[dia][id + '@' + hora];
    Object.keys(t).sort().slice(0, -7).forEach(function (d) { delete t[d]; });   // guarda só 7 dias
    PropertiesService.getScriptProperties().setProperty('TOMADOS', JSON.stringify(t));
  } finally {
    lock.releaseLock();
  }
}

function msHora_(dia, hhmm) {
  const p = String(hhmm).split(':');
  return new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), +p[0], +p[1] || 0).getTime();
}

function remediosHoje_() {
  const agora = new Date(), feitos = tomados_()[hojeIso_()] || {}, out = [];
  const lista = listaRemedios_();
  lista.forEach(function (r) {
    r.horas.forEach(function (h) {
      out.push({ id: r.id, nome: r.nome, dose: r.dose, hora: h, ms: msHora_(agora, h), tomado: feitos[r.id + '@' + h] || null });
    });
  });
  out.sort(function (a, b) { return a.ms - b.ms; });
  return { lista: lista, hoje: out };
}

// ---------------------------------------------------------- AULAS

function dataIsoParaDate_(s) { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

function semAcento_(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

/** Aulas de um dia, já com hora de sair e avisos de feriado/cancelamento. eventos = eventos do dia (opcional) */
function aulasDoDia_(d, eventos) {
  const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const ini = dataIsoParaDate_(CONFIG.PERIODO.inicio), fim = dataIsoParaDate_(CONFIG.PERIODO.fim);
  if (dia < ini || dia > fim) return [];
  const lista = [];
  CONFIG.AULAS.forEach(function (a) {
    a.horarios.forEach(function (h) {
      if (h.dia !== dia.getDay()) return;
      lista.push({
        cod: a.cod, nome: a.nome, curto: a.curto, prof: a.prof, local: a.local, sala: a.sala, cor: a.cor,
        ini: msHora_(dia, h.ini), fim: msHora_(dia, h.fim), hIni: h.ini, hFim: h.fim,
        saida: saidaDe_(dia, h.ini), saidaAte: saidaAte_(dia, h.ini),
        alertaSaida: true, status: 'normal', nota: ''
      });
    });
  });
  lista.sort(function (x, y) { return x.ini - y.ini; });
  // se a hora de sair cai durante (ou logo depois de) outra aula, você já está no campus
  for (let i = 1; i < lista.length; i++) {
    if (lista[i].saida < lista[i - 1].fim + 30 * 60000) lista[i].alertaSaida = false;
  }
  // feriados e avisos de "sem aula" vindos dos e-mails
  (eventos || []).forEach(function (e) {
    const t = semAcento_(e.titulo), feriado = /feriado|holiday/i.test(e.agenda || '');
    if (feriado) {
      const facultativo = /servidor|facultativo|carnaval|cinzas|corpus|vespera/.test(t);
      lista.forEach(function (a) {
        if (facultativo) { if (a.status === 'normal') { a.status = 'aviso'; a.nota = e.titulo + ' — confirme se há aula'; } }
        else { a.status = 'cancelada'; a.nota = 'Feriado: ' + e.titulo; }
      });
    } else if (e.tipo === 'sem_aula' || /^🚫/.test(e.titulo)) {
      const alvo = lista.filter(function (a) {
        return semAcento_(a.nome).split(' ').filter(function (w) { return w.length > 4; })
          .some(function (w) { return t.indexOf(w) >= 0; });
      });
      if (alvo.length) alvo.forEach(function (a) { a.status = 'cancelada'; a.nota = 'Aviso por e-mail: sem aula'; });
      else lista.forEach(function (a) { if (a.status === 'normal') { a.status = 'aviso'; a.nota = 'Há um aviso de "sem aula" hoje — confira o e-mail'; } });
    }
  });
  lista.forEach(function (a) { if (a.status === 'cancelada') a.alertaSaida = false; });
  return lista;
}

function ehTarde_(hIni) {
  const T = CONFIG.SAIDA_TARDE;
  return !!T && hIni >= T.aulasDe && hIni <= T.aulasAte;
}
/** Hora de sair de casa para uma aula (ms) */
function saidaDe_(dia, hIni) {
  return ehTarde_(hIni) ? msHora_(dia, CONFIG.SAIDA_TARDE.sairDe) : msHora_(dia, hIni) - CONFIG.DESLOCAMENTO_MIN * 60000;
}
/** Fim da janela de saída (ms), ou null */
function saidaAte_(dia, hIni) {
  return ehTarde_(hIni) ? msHora_(dia, CONFIG.SAIDA_TARDE.sairAte) : null;
}
/** Minutos entre a hora de sair e o início da aula (para os lembretes do celular) */
function antecedencia_(hIni) {
  const d = new Date(2026, 0, 1);
  return Math.round((msHora_(d, hIni) - saidaDe_(d, hIni)) / 60000);
}

/** Cria as aulas como eventos semanais na agenda "Faculdade" (aparecem no celular com lembrete). Pode rodar de novo sem duplicar. */
function criarAulasNaAgenda() {
  const cal = agendaFaculdade_();
  const ini = dataIsoParaDate_(CONFIG.PERIODO.inicio), fim = dataIsoParaDate_(CONFIG.PERIODO.fim);
  const ate = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() + 1);
  const existentes = {};
  let ajustados = 0;
  cal.getEvents(ini, ate).forEach(function (e) {
    const t = e.getTag('aula');
    if (!t || existentes[t]) return;
    existentes[t] = true;
    // atualiza os lembretes das séries já criadas (ex.: mudou a hora de sair)
    const hIni = t.split('-').pop(), min = antecedencia_(hIni);
    try {
      const s = e.getEventSeries();
      s.removeAllReminders(); s.addPopupReminder(min + 15); s.addPopupReminder(min);
      ajustados++;
    } catch (err) { console.warn('lembrete: ' + err); }
  });
  const W = [CalendarApp.Weekday.SUNDAY, CalendarApp.Weekday.MONDAY, CalendarApp.Weekday.TUESDAY, CalendarApp.Weekday.WEDNESDAY,
    CalendarApp.Weekday.THURSDAY, CalendarApp.Weekday.FRIDAY, CalendarApp.Weekday.SATURDAY];
  let n = 0;
  CONFIG.AULAS.forEach(function (a) {
    a.horarios.forEach(function (h) {
      const tag = a.cod + '-' + h.dia + '-' + h.ini;
      if (existentes[tag]) return;
      // primeira ocorrência a partir do início do período
      const p = new Date(ini);
      while (p.getDay() !== h.dia) p.setDate(p.getDate() + 1);
      const s = cal.createEventSeries(a.nome, new Date(msHora_(p, h.ini)), new Date(msHora_(p, h.fim)),
        CalendarApp.newRecurrence().addWeeklyRule().onlyOnWeekday(W[h.dia]).until(ate),
        { location: a.local, description: 'Prof. ' + a.prof + '\n' + a.cod + '\nCriado pelo Assistente de Parede.' });
      s.removeAllReminders();
      s.addPopupReminder(antecedencia_(h.ini) + 15);
      s.addPopupReminder(antecedencia_(h.ini));
      s.setTag('aula', tag);
      n++;
    });
  });
  Logger.log((n ? 'Criei ' + n + ' série(s) de aulas na agenda "' + cal.getName() + '". ' : 'As aulas já estavam na agenda. ') +
    (ajustados ? 'Lembretes atualizados em ' + ajustados + ' série(s).' : ''));
}

function ehAula_(e) {
  const t = semAcento_(e.titulo);
  return !!e.aula || CONFIG.AULAS.some(function (a) { return semAcento_(a.nome) === t; });
}

/** Roda a cada 15 min: e-mails gerais + e-mails da faculdade */
function rotina() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    tentar_(escanearEmails);
    tentar_(escanearFaculdade);
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------- e-mails → agenda

function marcador_() {
  return GmailApp.getUserLabelByName(CONFIG.MARCADOR) || GmailApp.createLabel(CONFIG.MARCADOR);
}

function slugMarcador_(nome) {
  return nome.toLowerCase().replace(/[\/ ]/g, '-');
}

function escanearEmails() {
  const label = marcador_();
  const semFaculdade = CONFIG.FACULDADE.REMETENTES.map(function (r) { return ' -from:' + r; }).join('');
  const busca = 'in:inbox newer_than:' + CONFIG.DIAS_EMAIL + 'd -from:me -category:promotions -category:social' +
    semFaculdade + ' -label:' + slugMarcador_(CONFIG.MARCADOR);
  const threads = GmailApp.search(busca, 0, 30);
  threads.forEach(function (th) {
    th.getMessages().slice(-3).forEach(function (m) {
      try { processarMensagem_(m); } catch (err) { console.warn('Erro no e-mail "' + m.getSubject() + '": ' + err); }
    });
    th.addLabel(label);
  });
}

function processarMensagem_(m) {
  let eventos = [];
  m.getAttachments().forEach(function (a) {
    const nome = (a.getName() || '').toLowerCase();
    const tipo = (a.getContentType() || '').toLowerCase();
    if (nome.endsWith('.ics') || tipo.indexOf('calendar') >= 0) {
      eventos = eventos.concat(lerIcs_(a.getDataAsString()));
    }
  });
  if (!eventos.length) {
    const ev = CONFIG.GEMINI_API_KEY ? extrairComGemini_(m) : extrairHeuristica_(m);
    if (ev) eventos.push(ev);
  }
  let n = 0;
  eventos.forEach(function (ev) { if (criarEvento_(ev, m)) n++; });
  return n;
}

// --- convites .ics
function lerIcs_(txt) {
  if (/METHOD:CANCEL/i.test(txt)) return [];
  const linhas = txt.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const out = [];
  let cur = null;
  linhas.forEach(function (l) {
    l = l.trim();
    if (l === 'BEGIN:VEVENT') { cur = {}; return; }
    if (l === 'END:VEVENT') { if (cur && cur.inicio) out.push(cur); cur = null; return; }
    if (!cur) return;
    const i = l.indexOf(':');
    if (i < 0) return;
    const nome = l.slice(0, i).split(';')[0].toUpperCase();
    const valor = l.slice(i + 1);
    if (nome === 'SUMMARY') cur.titulo = desescapar_(valor);
    else if (nome === 'LOCATION') cur.local = desescapar_(valor);
    else if (nome === 'DTSTART') { const d = dataIcs_(valor); cur.inicio = d.data; cur.diaInteiro = d.diaInteiro; }
    else if (nome === 'DTEND') cur.fim = dataIcs_(valor).data;
  });
  return out;
}

function dataIcs_(v) {
  const m = String(v).trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/);
  if (!m) return {};
  if (!m[4]) return { data: new Date(+m[1], +m[2] - 1, +m[3]), diaInteiro: true };
  if (m[7]) return { data: new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])), diaInteiro: false };
  return { data: new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]), diaInteiro: false };
}

function desescapar_(s) {
  return String(s).replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();
}

// --- leitura por regras (sem IA)
const PALAVRAS = /reuni[aã]o|consulta|entrevista|agendad|agendament|confirma[cç][aã]o|confirmad|convite|evento|reserva|voo|embarque|check-?in|ingresso|webinar|palestra|audi[eê]ncia|exame|prova|aula|anivers[aá]rio|lembrete|meeting|appointment|booking|invitation/i;
const MESES_RE = 'janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro';

function extrairHeuristica_(m) {
  const assunto = m.getSubject() || '';
  if (!PALAVRAS.test(assunto)) return null;
  const corpo = (m.getPlainBody() || '').slice(0, 4000);
  const base = m.getDate();
  const data = acharData_(assunto, base) || acharData_(corpo, base);
  if (!data) return null;
  const hora = acharHora_(assunto) || acharHora_(corpo);
  const ev = { titulo: limparAssunto_(assunto) };
  if (hora) {
    ev.inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate(), hora[0], hora[1]);
    ev.diaInteiro = false;
  } else {
    ev.inicio = data;
    ev.diaInteiro = true;
  }
  return ev;
}

function acharData_(txt, base) {
  let d = null, m;
  if ((m = txt.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) {
    d = montarData_(+m[1], +m[2], m[3], base);
  } else if ((m = txt.match(new RegExp('\\b(\\d{1,2})º?\\s+de\\s+(' + MESES_RE + ')(?:\\s+de\\s+(\\d{4}))?', 'i')))) {
    const mes = MESES.indexOf(m[2].toLowerCase().replace('marco', 'março')) + 1;
    d = montarData_(+m[1], mes, m[3], base);
  } else if (/\bamanh[aã](?![a-z])/i.test(txt)) {
    d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
  } else if (/\bhoje\b/i.test(txt)) {
    d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  }
  if (!d || isNaN(d)) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return d >= hoje ? d : null;
}

function montarData_(dia, mes, ano, base) {
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;
  let a = ano ? +ano : base.getFullYear();
  if (a < 100) a += 2000;
  let d = new Date(a, mes - 1, dia);
  if (!ano && d < new Date(base.getTime() - 7 * 86400000)) d = new Date(a + 1, mes - 1, dia);
  return d;
}

function acharHora_(txt) {
  const padroes = [
    /(?:^|[\s,(])[àa]s\s+(\d{1,2})(?:[:h](\d{2}))?\s*h?/i,
    /\b(\d{1,2}):(\d{2})\b/,
    /\b(\d{1,2})h(\d{2})?\b/i
  ];
  for (let i = 0; i < padroes.length; i++) {
    const m = txt.match(padroes[i]);
    if (m && +m[1] < 24 && (!m[2] || +m[2] < 60)) return [+m[1], m[2] ? +m[2] : 0];
  }
  return null;
}

function limparAssunto_(s) {
  return s.replace(/^\s*((re|res|fw|fwd|enc|tr)\s*:\s*)+/i, '').trim() || 'Compromisso';
}

// --- leitura com IA (opcional)
function extrairComGemini_(m) {
  const hoje = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const prompt =
    'Hoje é ' + hoje + ' (fuso America/Sao_Paulo). Analise o e-mail abaixo. ' +
    'Se ele marca, confirma, lembra ou convida para um compromisso com data definida (reunião, consulta, exame, voo, ' +
    'viagem, evento, aula, entrega agendada, prazo importante), responda SOMENTE com JSON: ' +
    '{"evento":true,"titulo":"título curto em português","inicio":"YYYY-MM-DDTHH:MM","fim":"YYYY-MM-DDTHH:MM ou vazio","local":"..."}. ' +
    'Se não houver horário, use "inicio":"YYYY-MM-DD". ' +
    'Se for propaganda, newsletter, recibo, cobrança sem data de compromisso ou qualquer outra coisa, responda {"evento":false}.\n\n' +
    'De: ' + m.getFrom() + '\nData do e-mail: ' + m.getDate() + '\nAssunto: ' + m.getSubject() + '\n\n' +
    (m.getPlainBody() || '').slice(0, 6000);
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.GEMINI_MODELO +
    ':generateContent?key=' + CONFIG.GEMINI_API_KEY;
  const r = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 }
    })
  });
  if (r.getResponseCode() !== 200) {
    console.warn('Gemini falhou, usando regras: ' + r.getContentText().slice(0, 300));
    return extrairHeuristica_(m);
  }
  const j = JSON.parse(JSON.parse(r.getContentText()).candidates[0].content.parts[0].text);
  if (!j.evento || !j.inicio) return null;
  const ini = lerIso_(j.inicio);
  if (!ini) return null;
  return {
    titulo: j.titulo || limparAssunto_(m.getSubject() || ''),
    inicio: ini.data, diaInteiro: ini.diaInteiro,
    fim: j.fim ? (lerIso_(j.fim) || {}).data : null,
    local: j.local || ''
  };
}

function lerIso_(s) {
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  if (!m[4]) return { data: new Date(+m[1], +m[2] - 1, +m[3]), diaInteiro: true };
  return { data: new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]), diaInteiro: false };
}

// --- cria o evento (sem duplicar)
function normalizar_(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w.length >= 4; });
}

function jaExiste_(titulo, ini, diaInteiro, msgId) {
  const palavras = normalizar_(titulo);
  const de = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate());
  const ate = new Date(de.getTime() + 86400000);
  return CalendarApp.getAllCalendars().some(function (c) {
    return c.getEvents(de, ate).some(function (e) {
      if (e.getTag('assistente') === msgId) return true;
      const mesmoHorario = diaInteiro ? e.isAllDayEvent() : Math.abs(e.getStartTime() - ini) < 60000;
      if (!mesmoHorario) return false;
      const outras = normalizar_(e.getTitle());
      return palavras.some(function (w) { return outras.indexOf(w) >= 0; });
    });
  });
}

/**
 * opt (opcional): { cal, tipo, cor, lembretes: [minutos], copiarPara: [ids de agendas] }
 */
function criarEvento_(ev, m, opt) {
  opt = opt || {};
  if (!ev.inicio || isNaN(ev.inicio)) return false;
  if (ev.inicio < new Date(Date.now() - 86400000)) return false;
  const titulo = String(ev.titulo || limparAssunto_(m.getSubject() || '')).slice(0, 200);
  if (jaExiste_(titulo, ev.inicio, ev.diaInteiro, m.getId())) return false;

  const opcoes = {
    location: ev.local || '',
    description: 'Adicionado automaticamente pelo Assistente de Parede.\n' +
      'E-mail: "' + m.getSubject() + '" — ' + m.getFrom() + '\n' +
      'https://mail.google.com/mail/u/0/#all/' + m.getId()
  };
  const lembretes = opt.lembretes || (ev.diaInteiro ? [] : [60]);
  const agendas = [opt.cal || CalendarApp.getDefaultCalendar()];
  (opt.copiarPara || []).forEach(function (ref) {
    const c = acharAgenda_(ref);
    if (!c) { console.warn('Agenda não encontrada: ' + ref); return; }
    if (agendas.some(function (a) { return a.getId() === c.getId(); })) return;
    agendas.push(c);
  });

  agendas.forEach(function (cal) {
    let e;
    if (ev.diaInteiro) {
      e = cal.createAllDayEvent(titulo, ev.inicio, opcoes);
    } else {
      const fim = (ev.fim && ev.fim > ev.inicio) ? ev.fim : new Date(ev.inicio.getTime() + 3600000);
      e = cal.createEvent(titulo, ev.inicio, fim, opcoes);
    }
    e.removeAllReminders();
    lembretes.slice(0, 5).forEach(function (min) { e.addPopupReminder(min); });
    if (opt.cor) { try { e.setColor(CalendarApp.EventColor[opt.cor]); } catch (err) {} }
    e.setTag('assistente', m.getId());
    if (opt.tipo) e.setTag('tipo', opt.tipo);
  });
  registrarAdicionado_(titulo, ev.inicio, ev.diaInteiro);
  return true;
}

// ---------------------------------------------------------- FACULDADE

const TIPOS = {
  sem_aula: {
    nome: '🚫 Sem aula', fala: 'não vai ter aula', cor: 'GRAY', lembretes: [600],
    re: /n[aã]o\s+(haver[aá]|teremos|vai\s+ter|ter[aá]|ocorrer[aá])\s+(a\s+|as\s+)?aulas?|aulas?\s+(est[aá]\s+|ser[aá]\s+|foi\s+|est[aã]o\s+|ser[aã]o\s+|foram\s+)?(cancelad|suspens)|cancelamento\s+d[ae]s?\s+aulas?|suspens[aã]o\s+d[ae]s?\s+aulas?|\bsem\s+aulas?\b|ponto\s+facultativo/i
  },
  reposicao: {
    nome: '🔁 Aula extra', fala: 'aula extra', cor: 'CYAN', lembretes: [1440, 60],
    re: /reposi[cç][aã]o\s+de\s+aula|aula\s+(extra|de\s+reposi[cç][aã]o|de\s+refor[cç]o)|aulas?\s+(remarcada|transferida|antecipada)|mudan[cç]a\s+de\s+(sala|hor[aá]rio\s+da\s+aula)/i
  },
  prova: {
    nome: '📝 Prova', fala: 'prova', cor: 'RED', lembretes: [2880, 1440],
    re: /\bprovas?\b|\bP[1-4]\b|segunda\s+chamada|exame\s+(final|especial)|avalia[cç][aã]o\s+(parcial|final|escrita|presencial|online|\d)|prova\s+substitutiva|\bquiz\b/i
  },
  entrega: {
    nome: '📚 Entrega', fala: 'entrega', cor: 'ORANGE', lembretes: [1440, 180],
    re: /\bentrega\b|entregar|prazo\s+(de\s+entrega|final|para)|lista\s+de\s+exerc|nova\s+atividade|atividade\s+avaliativa|trabalho\s+(final|pr[aá]tico|em\s+grupo|avaliativo)|relat[oó]rio|semin[aá]rio|tarefa|question[aá]rio|submiss[aã]o/i
  }
};

// e-mails da faculdade que nunca viram evento
const IGNORAR_FACULDADE = /boletim|newsletter|informativo|canva|alerta\s+de\s+seguran|c[oó]digo|senha|confirma[cç][aã]o\s+de\s+encaminhamento|verifica[cç][aã]o|edital\s+de\s+sele|vagas?\s+de\s+est[aá]gio|bolsa/i;

/**
 * E-mail encaminhado pela ponte da UFSJ: recupera remetente, assunto, data e texto originais.
 */
function original_(m) {
  const corpo = m.getPlainBody() || '';
  const base = { de: m.getFrom(), assunto: m.getSubject() || '', corpo: corpo, data: m.getDate() };
  // cabeçalho posto pela Ponte UFSJ
  const pt = corpo.match(/\[PONTE-UFSJ\]\s*De:\s*(.*?)\s*\|\s*Data:\s*(\S+)\s*\|\s*Assunto:\s*(.*)/);
  if (pt) {
    const dp = new Date(pt[2]);
    return { de: pt[1], assunto: pt[3].trim(), corpo: corpo.slice(pt.index + pt[0].length), data: isNaN(dp) ? base.data : dp };
  }
  // encaminhado pela ponte antiga (sem cabeçalho): usa o "responder para", se houver
  if (/aluno\.ufsj\.edu\.br/i.test(base.de)) {
    const rt = m.getReplyTo && m.getReplyTo();
    if (rt && rt !== base.de && !/aluno\.ufsj\.edu\.br/i.test(rt)) base.de = rt;
    base.assunto = limparAssunto_(base.assunto);
  }
  const mm =corpo.match(/-{3,}\s*(?:Forwarded message|Mensagem encaminhada)\s*-{3,}([\s\S]{0,800}?)\r?\n\s*\r?\n/i);
  if (!mm) return base;
  const cab = mm[1];
  function pega(re) { const x = cab.match(re); return x ? x[1].trim() : ''; }
  const dataTxt = pega(/(?:Date|Data):\s*(.+)/i).replace(/\s+(?:at|às)\s+/i, ' ');
  const data = new Date(dataTxt);
  return {
    de: pega(/(?:From|De):\s*(.+)/i) || base.de,
    assunto: pega(/(?:Subject|Assunto):\s*(.+)/i) || limparAssunto_(base.assunto),
    corpo: corpo.slice(mm.index + mm[0].length),
    data: isNaN(data) ? base.data : data
  };
}

/** "Nova notícia na(s) turma(s) EL015 - EQUAÇÕES DIFERENCIAIS (66h) - Turma 01" → "Equações Diferenciais" */
function disciplinaSigaa_(assunto) {
  const x = String(assunto).match(/turma\(?s?\)?\s+[A-Z]{1,4}\d+\s*-\s*([^(\-]+?)\s*(\(|-|$)/i);
  if (!x) return '';
  return x[1].toLowerCase().replace(/(^|\s)(\S)/g, function (a, b, c) { return b + c.toUpperCase(); })
    .replace(/\b(De|Da|Do|Das|Dos|E|Em)\b/g, function (w) { return w.toLowerCase(); })
    .replace(/\b(Ii|Iii|Iv|Vi|Vii)\b/g, function (w) { return w.toUpperCase(); });
}
const ORDEM_TIPOS = ['sem_aula', 'reposicao', 'prova', 'entrega'];

/** Encontra uma agenda por 'principal', nome ou ID */
function acharAgenda_(ref) {
  if (!ref) return null;
  if (/^(principal|primary|gmail)$/i.test(ref)) return CalendarApp.getDefaultCalendar();
  return CalendarApp.getCalendarById(ref) || CalendarApp.getCalendarsByName(ref)[0] || null;
}

/** Mostra no registro todas as suas agendas com os IDs */
function listarAgendas() {
  Logger.log('SUAS AGENDAS (nome → ID):');
  CalendarApp.getAllCalendars().forEach(function (c) {
    Logger.log('  • ' + c.getName() + ' → ' + c.getId() + (c.isMyPrimaryCalendar() ? '   (principal)' : ''));
  });
  CONFIG.FACULDADE.COPIAR_PARA.forEach(function (ref) {
    const c = acharAgenda_(ref);
    Logger.log(c ? 'Eventos da faculdade também vão para: ' + c.getName() : '⚠️ Não achei a agenda "' + ref + '"');
  });
}

function agendaFaculdade_() {
  const nome = CONFIG.FACULDADE.NOME_AGENDA;
  const cals = CalendarApp.getOwnedCalendarsByName(nome);
  if (cals.length) return cals[0];
  return CalendarApp.createCalendar(nome, { timeZone: TZ, color: CalendarApp.Color.PURPLE });
}

function escanearFaculdade() {
  const F = CONFIG.FACULDADE;
  if (!F.REMETENTES.length) return;
  const label = GmailApp.getUserLabelByName(F.MARCADOR) || GmailApp.createLabel(F.MARCADOR);
  const busca = '(' + F.REMETENTES.map(function (r) { return 'from:' + r; }).join(' OR ') + ')' +
    ' newer_than:' + F.DIAS + 'd -label:' + slugMarcador_(F.MARCADOR);
  const cal = agendaFaculdade_();
  GmailApp.search(busca, 0, 40).forEach(function (th) {
    th.getMessages().slice(-3).forEach(function (m) {
      try {
        eventosFaculdade_(m).forEach(function (ev) {
          const t = TIPOS[ev.tipo];
          criarEvento_(ev, m, { cal: cal, tipo: ev.tipo, cor: t.cor, lembretes: t.lembretes, copiarPara: F.COPIAR_PARA });
        });
      } catch (err) {
        console.warn('Erro no e-mail da faculdade "' + m.getSubject() + '": ' + err);
      }
    });
    th.addLabel(label);
  });
}

/**
 * Desfaz o que a leitura da faculdade já criou e lê tudo de novo com as regras atuais.
 * Só mexe em eventos criados pelo assistente a partir de e-mails da faculdade
 * (os eventos vão para a lixeira do Google Agenda, onde ficam 30 dias).
 */
function refazerFaculdade() {
  const F = CONFIG.FACULDADE;
  const h = new Date();
  const de = new Date(h.getFullYear(), h.getMonth(), h.getDate() - 30);
  const ate = new Date(h.getFullYear(), h.getMonth(), h.getDate() + 180);
  const agendas = [agendaFaculdade_()];
  F.COPIAR_PARA.forEach(function (r) { const c = acharAgenda_(r); if (c) agendas.push(c); });
  let n = 0;
  agendas.forEach(function (c) {
    c.getEvents(de, ate).forEach(function (e) {
      if (e.getTag('assistente') && e.getTag('tipo')) { e.deleteEvent(); n++; }
    });
  });
  const label = GmailApp.getUserLabelByName(F.MARCADOR);
  if (label) {
    let th;
    while ((th = label.getThreads(0, 100)).length) label.removeFromThreads(th);
  }
  PropertiesService.getScriptProperties().deleteProperty('ADICIONADOS');
  Logger.log('Removi ' + n + ' evento(s) antigos da faculdade. Lendo de novo…');
  escanearFaculdade();
  Logger.log('Pronto. Agora na agenda Faculdade: ' + faculdadeProximos_().map(function (e) { return e.titulo; }).join(' | '));
}

function tipoDe_(txt) {
  for (let i = 0; i < ORDEM_TIPOS.length; i++) if (TIPOS[ORDEM_TIPOS[i]].re.test(txt)) return ORDEM_TIPOS[i];
  return null;
}

function tituloFaculdade_(tipo, resto) {
  // "[CAL1] Aviso" vira "CAL1: Aviso" (mantém a sigla da matéria)
  return TIPOS[tipo].nome + ' — ' + String(resto || '').replace(/^\s*\[([^\]]*)\]\s*/, '$1: ').trim();
}

/** Para entregas com horário, o evento termina no prazo (ex.: 22:59–23:59). */
function ajustarEntrega_(ev) {
  if (ev.tipo === 'entrega' && !ev.diaInteiro) {
    ev.fim = ev.inicio;
    ev.inicio = new Date(ev.fim.getTime() - 3600000);
  }
  return ev;
}

function eventosFaculdade_(m) {
  // 1) convites/arquivos de calendário (Moodle, Classroom, SIGAA…)
  let evs = [];
  m.getAttachments().forEach(function (a) {
    const nome = (a.getName() || '').toLowerCase();
    const tipoArq = (a.getContentType() || '').toLowerCase();
    if (nome.endsWith('.ics') || tipoArq.indexOf('calendar') >= 0) {
      lerIcs_(a.getDataAsString()).forEach(function (ev) {
        ev.tipo = tipoDe_(ev.titulo || '') || 'entrega';
        ev.titulo = tituloFaculdade_(ev.tipo, ev.titulo);
        evs.push(ev);
      });
    }
  });
  if (evs.length) return evs;

  // 2) IA (se tiver chave) — entende qualquer e-mail
  if (CONFIG.GEMINI_API_KEY) {
    const g = faculdadeGemini_(m);
    if (g) return g;
  }

  // 3) regras
  return faculdadeHeuristica_(m);
}

function faculdadeHeuristica_(m) {
  const o = original_(m);
  const assunto = limparAssunto_(o.assunto);
  if (IGNORAR_FACULDADE.test(assunto)) return [];
  const corpo = o.corpo.slice(0, 5000);
  const tipo = tipoDe_(assunto) || tipoDe_(corpo.slice(0, 1200));
  if (!tipo) return [];
  // a data precisa estar PERTO da palavra-chave (evita pegar datas soltas do e-mail)
  const texto = assunto + '\n' + corpo;
  const pos = texto.search(TIPOS[tipo].re);
  const trecho = pos >= 0 ? texto.slice(Math.max(0, pos - 120), pos + 240) : '';
  const base = o.data;
  const data = acharData_(trecho, base) || acharData_(assunto, base);
  if (!data) return [];
  const hora = acharHora_(trecho) || acharHora_(assunto);
  const disc = disciplinaSigaa_(assunto);
  const ev = { tipo: tipo, titulo: tituloFaculdade_(tipo, disc || assunto) };
  if (hora) {
    ev.inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate(), hora[0], hora[1]);
    ev.diaInteiro = false;
  } else {
    ev.inicio = data;
    ev.diaInteiro = true;
  }
  return [ajustarEntrega_(ev)];
}

function chamarGemini_(prompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.GEMINI_MODELO +
    ':generateContent?key=' + CONFIG.GEMINI_API_KEY;
  const r = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 }
    })
  });
  if (r.getResponseCode() !== 200) {
    console.warn('Gemini falhou: ' + r.getContentText().slice(0, 300));
    return null;
  }
  return JSON.parse(JSON.parse(r.getContentText()).candidates[0].content.parts[0].text);
}

function faculdadeGemini_(m) {
  const o = original_(m);
  if (IGNORAR_FACULDADE.test(o.assunto)) return [];
  const hoje = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd (EEEE)');
  const j = chamarGemini_(
    'Hoje é ' + hoje + ' (fuso America/Sao_Paulo). Este é um e-mail da faculdade de um estudante. ' +
    'Extraia SOMENTE o que é importante para a agenda dele:\n' +
    '- "prova": provas, avaliações, testes, segunda chamada, recuperação\n' +
    '- "entrega": trabalhos, atividades, listas, relatórios, seminários, apresentações e seus prazos\n' +
    '- "sem_aula": aula cancelada/suspensa, não haverá aula, feriado, recesso, greve, ponto facultativo\n' +
    '- "reposicao": reposição de aula, aula extra, aula remarcada, mudança de sala/horário\n' +
    'Ignore avisos gerais, eventos opcionais, newsletters e e-mails sem data. ' +
    'Responda com JSON: {"eventos":[{"tipo":"prova|entrega|sem_aula|reposicao","disciplina":"nome curto da matéria ou vazio",' +
    '"descricao":"o que é, bem curto","inicio":"YYYY-MM-DDTHH:MM ou YYYY-MM-DD se não houver horário",' +
    '"fim":"YYYY-MM-DDTHH:MM ou vazio","local":"sala/link ou vazio"}]}. ' +
    'Para entregas, "inicio" é o prazo final. Se não houver nada importante, responda {"eventos":[]}.\n\n' +
    'De: ' + o.de + '\nData do e-mail: ' + o.data + '\nAssunto: ' + o.assunto + '\n\n' +
    o.corpo.slice(0, 7000)
  );
  if (!j || !j.eventos) return null;
  const out = [];
  j.eventos.forEach(function (x) {
    if (!TIPOS[x.tipo] || !x.inicio) return;
    const ini = lerIso_(x.inicio);
    if (!ini) return;
    const resto = [x.disciplina, x.descricao].filter(function (s) { return s; }).join(': ') || limparAssunto_(o.assunto);
    out.push(ajustarEntrega_({
      tipo: x.tipo,
      titulo: tituloFaculdade_(x.tipo, resto),
      inicio: ini.data, diaInteiro: ini.diaInteiro,
      fim: x.fim ? (lerIso_(x.fim) || {}).data : null,
      local: x.local || ''
    }));
  });
  return out;
}

/** Próximos 7 dias da agenda da faculdade (para a tela e para a fala) */
function faculdadeProximos_() {
  const agora = new Date();
  const de = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const ate = new Date(de.getTime() + 8 * 86400000);
  return agendaFaculdade_().getEvents(de, ate)
    .filter(function (e) { return (e.isAllDayEvent() || e.getEndTime() > agora) && !e.getTag('aula') && e.getTag('tipo'); })
    .map(function (e) {
      const titulo = e.getTitle();
      const tipo = e.getTag('tipo');
      const i = titulo.indexOf(' — ');
      const resto = i >= 0 ? titulo.slice(i + 3) : titulo;
      return {
        tipo: tipo,
        titulo: titulo,
        resto: disciplinaSigaa_(resto) || resto,
        inicio: e.getStartTime().getTime(),
        fim: e.getEndTime().getTime(),
        diaInteiro: e.isAllDayEvent(),
        dia: diaCurto_(e.getStartTime()),
        // para entregas mostramos o prazo (fim do evento)
        prazo: (tipo === 'entrega' ? e.getEndTime() : e.getStartTime()).getTime(),
        hora: e.isAllDayEvent() ? '' : Utilities.formatDate(tipo === 'entrega' ? e.getEndTime() : e.getStartTime(), TZ, 'HH:mm')
      };
    })
    .sort(function (a, b) { return a.inicio - b.inicio; });
}

function diasAte_(ms) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const d = new Date(ms); d.setHours(0, 0, 0, 0);
  return Math.round((d - hoje) / 86400000);
}

function diaCurto_(d) {
  const n = diasAte_(d.getTime());
  if (n === 0) return 'Hoje';
  if (n === 1) return 'Amanhã';
  return DIAS[d.getDay()].slice(0, 3).replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + Utilities.formatDate(d, TZ, 'dd/MM');
}

function diaFalado_(ms) {
  const n = diasAte_(ms);
  if (n === 0) return 'hoje';
  if (n === 1) return 'amanhã';
  const dia = DIAS[new Date(ms).getDay()];
  return (dia === 'sábado' || dia === 'domingo' ? 'no ' : 'na ') + dia;
}

function registrarAdicionado_(titulo, ini, diaInteiro) {
  const props = PropertiesService.getScriptProperties();
  const lista = JSON.parse(props.getProperty('ADICIONADOS') || '[]');
  lista.unshift({ t: Date.now(), titulo: titulo, ini: ini.getTime(), diaInteiro: !!diaInteiro });
  props.setProperty('ADICIONADOS', JSON.stringify(lista.slice(0, 30)));
}

function adicionadosRecentes_() {
  const lista = JSON.parse(PropertiesService.getScriptProperties().getProperty('ADICIONADOS') || '[]');
  const limite = Date.now() - 24 * 3600000;
  return lista.filter(function (a) { return a.t > limite; }).map(function (a) {
    const d = new Date(a.ini);
    return {
      titulo: a.titulo,
      quando: Utilities.formatDate(d, TZ, 'dd/MM') + (a.diaInteiro ? '' : ' ' + Utilities.formatDate(d, TZ, 'HH:mm'))
    };
  });
}

// ---------------------------------------------------------- resumo do dia

function getBriefing() {
  const agora = new Date();
  const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  const evHoje = tentar_(function () { return eventosDoDia_(agora); }) || [];
  const evAmanha = tentar_(function () { return eventosDoDia_(amanha); }) || [];
  const r = {
    geradoEm: agora.getTime(),
    nome: CONFIG.NOME,
    horaAcordar: CONFIG.HORA_ACORDAR,
    horaNoite: CONFIG.HORA_NOITE,
    horaDormir: CONFIG.HORA_NOITE,
    deslocamento: CONFIG.DESLOCAMENTO_MIN,
    levar: CONFIG.LEVAR,
    dataTexto: DIAS[agora.getDay()] + ', ' + agora.getDate() + ' de ' + MESES[agora.getMonth()],
    cidade: CONFIG.CIDADE,
    clima: tentar_(clima_),
    hoje: evHoje.filter(function (e) { return !ehAula_(e); }),
    amanha: evAmanha.filter(function (e) { return !ehAula_(e); }),
    aulasHoje: tentar_(function () { return aulasDoDia_(agora, evHoje); }) || [],
    aulasAmanha: tentar_(function () { return aulasDoDia_(amanha, evAmanha); }) || [],
    grade: CONFIG.AULAS.map(function (a) { return { cod: a.cod, nome: a.nome, curto: a.curto, local: a.local, cor: a.cor, horarios: a.horarios }; }),
    remedios: tentar_(remediosHoje_) || { lista: [], hoje: [] },
    emails: tentar_(emailsImportantes_) || { total: 0, lista: [] },
    adicionados: tentar_(adicionadosRecentes_) || [],
    faculdade: tentar_(faculdadeProximos_) || [],
    proximos: tentar_(function () { return eventosProximos_(7); }) || [],
    mes: tentar_(mapaMes_)
  };
  r.fala = montarFala_(r, agora);
  return r;
}

function tentar_(fn) {
  try { return fn(); } catch (e) { console.warn(e); return null; }
}

function eventosDoDia_(d) {
  const ini = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return eventosPeriodo_(ini, new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 1));
}

/** Próximos dias (sem hoje), para a lista "Em breve" */
function eventosProximos_(dias) {
  const h = new Date();
  const ini = new Date(h.getFullYear(), h.getMonth(), h.getDate() + 1);
  const fim = new Date(h.getFullYear(), h.getMonth(), h.getDate() + 1 + dias);
  return eventosPeriodo_(ini, fim).filter(function (e) { return !ehAula_(e); }).slice(0, 12).map(function (e) {
    e.dia = diaCurto_(new Date(e.inicio));
    return e;
  });
}

/** Mapa do mês para o calendário: { "26": { n: 2, tipos: ["prova"] }, ... } */
function mapaMes_() {
  const h = new Date();
  const ini = new Date(h.getFullYear(), h.getMonth(), 1);
  const fim = new Date(h.getFullYear(), h.getMonth() + 1, 1);
  const mapa = {};
  function dia(d) { const k = String(d.getDate()); return (mapa[k] = mapa[k] || { n: 0, tipos: [], itens: [] }); }
  eventosPeriodo_(ini, fim).forEach(function (e) {
    const d = new Date(e.inicio);
    if (d < ini || ehAula_(e)) return;
    const m = dia(d), feriado = /feriado|holiday/i.test(e.agenda || '');
    m.n++;
    if (e.tipo && m.tipos.indexOf(e.tipo) < 0) m.tipos.push(e.tipo);
    if (feriado && m.tipos.indexOf('feriado') < 0) m.tipos.push('feriado');
    m.itens.push({ t: e.titulo.replace(/^[^\p{L}\p{N}]+/u, ''), h: e.diaInteiro ? '' : e.hora, tipo: feriado ? 'feriado' : (e.tipo || '') });
  });
  return { ano: h.getFullYear(), mes: h.getMonth(), dias: mapa };
}

function eventosPeriodo_(ini, fim) {
  const vistos = {};
  const lista = [];
  CalendarApp.getAllCalendars().forEach(function (c) {
    if (c.isHidden()) return;
    c.getEvents(ini, fim).forEach(function (e) {
      const chave = e.getTitle() + '|' + e.getStartTime().getTime();
      if (vistos[chave]) return;
      vistos[chave] = true;
      lista.push({
        titulo: e.getTitle() || '(sem título)',
        inicio: e.getStartTime().getTime(),
        fim: e.getEndTime().getTime(),
        diaInteiro: e.isAllDayEvent(),
        hora: e.isAllDayEvent() ? 'Dia todo' : Utilities.formatDate(e.getStartTime(), TZ, 'HH:mm'),
        local: e.getLocation() || '',
        tipo: e.getTag('tipo') || '',
        aula: e.getTag('aula') || '',
        agenda: c.getName()
      });
    });
  });
  lista.sort(function (a, b) { return (b.diaInteiro - a.diaInteiro) || (a.inicio - b.inicio); });
  return lista;
}

function climaDesc_(c) {
  if (c === 0) return ['Céu limpo', '☀️'];
  if (c === 1) return ['Predominantemente limpo', '🌤️'];
  if (c === 2) return ['Parcialmente nublado', '⛅'];
  if (c === 3) return ['Nublado', '☁️'];
  if (c === 45 || c === 48) return ['Neblina', '🌫️'];
  if (c >= 51 && c <= 57) return ['Garoa', '🌦️'];
  if (c === 61 || c === 66) return ['Chuva fraca', '🌧️'];
  if (c === 63) return ['Chuva moderada', '🌧️'];
  if (c === 65 || c === 67) return ['Chuva forte', '🌧️'];
  if (c >= 71 && c <= 77) return ['Neve', '❄️'];
  if (c >= 80 && c <= 82) return ['Pancadas de chuva', '🌦️'];
  if (c === 85 || c === 86) return ['Neve', '❄️'];
  if (c >= 95) return ['Trovoadas', '⛈️'];
  return ['—', '🌡️'];
}

function clima_() {
  const cache = CacheService.getScriptCache();
  const salvo = cache.get('clima');
  if (salvo) return JSON.parse(salvo);
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + CONFIG.LAT + '&longitude=' + CONFIG.LON +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max' +
    '&timezone=America%2FSao_Paulo&forecast_days=2';
  const j = JSON.parse(UrlFetchApp.fetch(url).getContentText());
  const atual = climaDesc_(j.current.weather_code);
  const dAm = climaDesc_(j.daily.weather_code[1]);
  const c = {
    agora: Math.round(j.current.temperature_2m),
    sensacao: Math.round(j.current.apparent_temperature),
    umidade: j.current.relative_humidity_2m,
    descricao: atual[0], icone: atual[1],
    max: Math.round(j.daily.temperature_2m_max[0]),
    min: Math.round(j.daily.temperature_2m_min[0]),
    chuva: j.daily.precipitation_probability_max[0] || 0,
    uv: Math.round(j.daily.uv_index_max[0] || 0),
    amanha: {
      max: Math.round(j.daily.temperature_2m_max[1]),
      min: Math.round(j.daily.temperature_2m_min[1]),
      chuva: j.daily.precipitation_probability_max[1] || 0,
      descricao: dAm[0], icone: dAm[1]
    }
  };
  cache.put('clima', JSON.stringify(c), 900);
  return c;
}

function nomeRemetente_(from) {
  const m = String(from).match(/^\s*"?([^"<]+?)"?\s*</);
  return m ? m[1].trim() : String(from).replace(/[<>]/g, '').trim();
}

function emailsImportantes_() {
  const threads = GmailApp.search('is:unread in:inbox category:primary newer_than:2d', 0, 30);
  return {
    total: threads.length,
    lista: threads.slice(0, 6).map(function (th) {
      const msgs = th.getMessages();
      const ult = msgs[msgs.length - 1];
      const o = /ufsj\.edu\.br/i.test(ult.getFrom()) ? original_(ult) : { de: ult.getFrom(), assunto: th.getFirstMessageSubject() };
      return {
        de: nomeRemetente_(o.de),
        assunto: limparAssunto_(o.assunto || '') || '(sem assunto)',
        hora: Utilities.formatDate(th.getLastMessageDate(), TZ, 'dd/MM HH:mm')
      };
    })
  };
}

function noticias_() {
  const cache = CacheService.getScriptCache();
  const salvo = cache.get('noticias');
  if (salvo) return JSON.parse(salvo);
  const xml = UrlFetchApp.fetch('https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419').getContentText();
  const itens = XmlService.parse(xml).getRootElement().getChild('channel').getChildren('item');
  const lista = itens.slice(0, CONFIG.NOTICIAS).map(function (i) {
    const t = i.getChildText('title');
    const p = t.lastIndexOf(' - ');
    return { titulo: p > 0 ? t.slice(0, p) : t, fonte: p > 0 ? t.slice(p + 3) : '' };
  });
  cache.put('noticias', JSON.stringify(lista), 1800);
  return lista;
}

// ---------------------------------------------------------- texto falado

function horaFalada_(ms) {
  const d = new Date(ms);
  const h = +Utilities.formatDate(d, TZ, 'H');
  const m = +Utilities.formatDate(d, TZ, 'm');
  if (h === 0 && m === 0) return 'meia-noite';
  if (h === 12 && m === 0) return 'meio-dia';
  return m === 0 ? h + (h === 1 ? ' hora' : ' horas') : h + ' e ' + m;
}

/** "às 8 horas", "ao meio-dia", "à 1 hora" */
function asHora_(ms) {
  const f = horaFalada_(ms);
  if (f === 'meio-dia') return 'ao meio-dia';
  if (f === 'meia-noite') return 'à meia-noite';
  if (/^1( |$)/.test(f)) return 'à ' + f;
  return 'às ' + f;
}

function plural_(n, s, p) { return n + ' ' + (n === 1 ? s : p); }

function montarFala_(r, agora) {
  const h = +Utilities.formatDate(agora, TZ, 'H');
  const t = agora.getTime();
  const saud = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const p = [saud + ', ' + CONFIG.NOME + '. Hoje é ' + r.dataTexto + '.'];

  // 1. aulas — o mais importante primeiro
  const aulas = r.aulasHoje.filter(function (a) { return a.fim > t; });
  const valem = aulas.filter(function (a) { return a.status !== 'cancelada'; });
  const canceladas = aulas.filter(function (a) { return a.status === 'cancelada'; });
  if (valem.length) {
    p.push((valem.length === 1 ? 'Você tem uma aula' : 'Você tem ' + valem.length + ' aulas') + ' pela frente.');
    valem.forEach(function (a, i) {
      let f = (valem.length === 1 ? 'É ' : i === 0 ? 'Primeiro, ' : i === valem.length - 1 ? 'Por último, ' : 'Depois, ') +
        a.nome + ' ' + asHora_(a.ini) + ', na ' + a.sala + '.';
      if (a.alertaSaida && (a.saidaAte || a.saida) > t) f += ' Saia de casa ' + (a.saidaAte ? 'entre ' + horaFalada_(a.saida) + ' e ' + horaFalada_(a.saidaAte) : asHora_(a.saida)) + '.';
      if (a.status === 'aviso') f += ' Atenção: ' + a.nota + '.';
      p.push(f);
    });
  } else if (!aulas.length && r.aulasHoje.length) {
    p.push('Suas aulas de hoje já terminaram.');
  } else if (!r.aulasHoje.length) {
    p.push('Hoje você não tem aula.');
  }
  canceladas.forEach(function (a) { p.push(a.nome + ' de hoje não vai acontecer. ' + a.nota + '.'); });

  // 2. remédios ainda não tomados
  const rem = (r.remedios.hoje || []).filter(function (x) { return !x.tomado && x.ms > t - 3 * 3600000; });
  if (rem.length) {
    p.push('Remédios: ' + rem.slice(0, 4).map(function (x) {
      return x.nome + (x.ms <= t ? ', que já passou da hora' : ' ' + asHora_(x.ms));
    }).join('; ') + '.');
  }

  // 3. outros compromissos da agenda
  const pend = r.hoje.filter(function (e) { return !e.diaInteiro && e.fim > t; });
  if (pend.length) {
    p.push('Na agenda: ' + pend.slice(0, 3).map(function (e) { return e.titulo + ' ' + asHora_(e.inicio); }).join('; ') + '.');
  }

  // 4. provas e prazos da semana
  const fac = r.faculdade.filter(function (e) { return e.tipo === 'prova' || e.tipo === 'entrega'; });
  if (fac.length) {
    p.push('Fique de olho: ' + fac.slice(0, 3).map(function (e) {
      const hora = e.diaInteiro ? '' : (e.tipo === 'entrega' ? ' até ' : ' ') + asHora_(e.prazo);
      return TIPOS[e.tipo].fala + ' de ' + e.resto + ', ' + diaFalado_(e.inicio) + hora;
    }).join('; ') + '.');
  }

  // 5. clima, curto
  const c = r.clima;
  if (c) {
    let f = 'Agora faz ' + c.agora + ' graus, ' + c.descricao.toLowerCase() + ', com máxima de ' + c.max + '.';
    if (c.chuva >= 50) f += ' Leve guarda-chuva.';
    p.push(f);
  }

  // 6. amanhã (à noite)
  if (h >= 17) {
    const am = (r.aulasAmanha || []).filter(function (a) { return a.status !== 'cancelada'; });
    if (am.length) p.push('Amanhã a primeira aula é ' + am[0].nome + ' ' + asHora_(am[0].ini) + '; saia ' + (am[0].saidaAte ? 'entre ' + horaFalada_(am[0].saida) + ' e ' + horaFalada_(am[0].saidaAte) : asHora_(am[0].saida)) + '.');
    else p.push('Amanhã você não tem aula.');
  }

  return p.join(' ');
}
