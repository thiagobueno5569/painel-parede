/**
 * PONTE UFSJ → GMAIL
 * ------------------------------------------------------------
 * Este script roda NA CONTA DA FACULDADE (thiagopereirabuenoi@aluno.ufsj.edu.br).
 * A cada 15 minutos ele encaminha os e-mails novos da caixa de entrada
 * para o seu Gmail pessoal, onde o Assistente de Parede lê e põe na agenda.
 *
 * Use só se o encaminhamento automático do Gmail da UFSJ estiver bloqueado.
 * Depois de colar, rode a função setup() uma vez.
 */

const DESTINO = 'thiagopereirabuenoi@gmail.com';
const DIAS_INICIAIS = 14;   // na primeira vez, encaminha os e-mails dos últimos X dias

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('encaminhar').timeBased().everyMinutes(15).create();
  const n = encaminhar();
  Logger.log('Pronto! Encaminhei ' + n + ' e-mail(s) para ' + DESTINO + '. Daqui pra frente roda sozinho a cada 15 min.');
}

function esc_(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function encaminhar() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return 0;
  try {
    const props = PropertiesService.getScriptProperties();
    const ultimo = +(props.getProperty('ULTIMO') || (Date.now() - DIAS_INICIAIS * 86400000));
    const threads = GmailApp.search('in:inbox -in:sent after:' + Math.floor(ultimo / 1000), 0, 100);

    const eu = String(Session.getActiveUser().getEmail() || '').toLowerCase();
    let novas = [];
    threads.forEach(function (th) {
      th.getMessages().forEach(function (m) {
        const t = m.getDate().getTime();
        if (t <= ultimo) return;
        if (m.getFrom().indexOf(DESTINO) >= 0) return;   // não devolve o que veio do Gmail pessoal
        if (eu && m.getFrom().toLowerCase().indexOf(eu) >= 0) return;   // nem as próprias cópias encaminhadas (evita repetir)
        novas.push(m);
      });
    });
    novas.sort(function (a, b) { return a.getDate() - b.getDate(); });

    let maior = ultimo, n = 0;
    novas.forEach(function (m) {
      try {
        // cabeçalho com remetente, data e assunto originais (o assistente lê isso no Gmail pessoal)
        const cab = '<div style="color:#888;font-size:11px">[PONTE-UFSJ] De: ' + esc_(m.getFrom()) +
          ' | Data: ' + m.getDate().toISOString() + ' | Assunto: ' + esc_(m.getSubject()) + '</div><br>';
        const end = (m.getFrom().match(/<([^>]+)>/) || [null, m.getFrom()])[1];
        m.forward(DESTINO, { subject: m.getSubject(), htmlBody: cab + m.getBody(), replyTo: end });
        n++;
      } catch (e) {
        console.warn('Não consegui encaminhar "' + m.getSubject() + '": ' + e);
      }
      maior = Math.max(maior, m.getDate().getTime());
    });
    props.setProperty('ULTIMO', String(maior));
    return n;
  } finally {
    lock.releaseLock();
  }
}
