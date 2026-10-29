// Funções do painel administrativo PIBVL.
// Adicione este arquivo ao projeto Apps Script junto de Admin.html.
// O doGet existente deve tratar ?painel=1, conforme INSTRUCOES.md.

const ADMIN_OAUTH_CLIENT_ID = "2825703529-k89sf13k5lt42mtq6g0bi8r3cmm4c3tn.apps.googleusercontent.com";
const ADMIN_EMAILS = [
  "pibdevazlobo1939@gmail.com",
  "luquinhas.so0412@gmail.com",
  "gabriellediasp@gmail.com"
];

function adminValidarAcesso(idToken) {
  const usuario = adminVerificarToken_(idToken);
  return { ok: true, email: usuario.email };
}

function adminListarMembros(idToken) {
  adminVerificarToken_(idToken);
  const ss = SpreadsheetApp.openById(ID_PLANILHA);
  const sh = ss.getSheetByName("Membros");
  if (!sh || sh.getLastRow() < 2) return { ok: true, membros: [] };

  const valores = sh.getDataRange().getDisplayValues();
  const cab = valores[0];
  const idx = titulo => cab.indexOf(titulo);
  const campo = (linha, titulo) => {
    const i = idx(titulo);
    return i >= 0 ? linha[i] : "";
  };

  const membros = valores.slice(1).map((linha, i) => ({
    linha: i + 2,
    nome: campo(linha, "Nome completo"),
    nascimento: campo(linha, "Data de nascimento"),
    celular: campo(linha, "Celular"),
    email: campo(linha, "E-mail"),
    batismo: campo(linha, "Data de batismo"),
    endereco: campo(linha, "Endereço"),
    bairro: campo(linha, "Bairro"),
    estadoCivil: campo(linha, "Estado civil")
  })).filter(m => m.nome || m.celular || m.email);

  return { ok: true, membros: membros };
}

function adminAtualizarMembro(idToken, dados) {
  const usuario = adminVerificarToken_(idToken);
  if (!dados || !Number.isInteger(Number(dados.linha)) || Number(dados.linha) < 2) {
    throw new Error("Registro inválido.");
  }
  if (!String(dados.nome || "").trim()) throw new Error("O nome completo é obrigatório.");

  const ss = SpreadsheetApp.openById(ID_PLANILHA);
  const sh = ss.getSheetByName("Membros");
  if (!sh || Number(dados.linha) > sh.getLastRow()) throw new Error("Cadastro não encontrado.");

  const linha = Number(dados.linha);
  const cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  const campos = {
    "Nome completo": String(dados.nome || "").trim(),
    "Celular": String(dados.celular || "").trim(),
    "E-mail": String(dados.email || "").trim(),
    "Endereço": String(dados.endereco || "").trim(),
    "Bairro": String(dados.bairro || "").trim(),
    "Estado civil": String(dados.estadoCivil || "").trim(),
    "Data de batismo": String(dados.batismo || "").trim()
  };

  const nomeAnterior = adminValor_(sh, linha, cab, "Nome completo");
  const mudancas = [];
  Object.keys(campos).forEach(titulo => {
    const i = cab.indexOf(titulo);
    if (i < 0) return;
    const anterior = sh.getRange(linha, i + 1).getDisplayValue();
    if (anterior !== campos[titulo]) {
      mudancas.push(titulo + ": " + anterior + " → " + campos[titulo]);
      sh.getRange(linha, i + 1).setValue(campos[titulo]);
    }
  });

  adminRegistrarHistorico_(ss, usuario.email, "Atualização de cadastro",
    campos["Nome completo"] || nomeAnterior,
    mudancas.length ? mudancas.join(" | ") : "Nenhuma alteração detectada.");

  SpreadsheetApp.flush();
  return { ok: true, mensagem: "Cadastro atualizado." };
}

function adminHistorico(idToken) {
  adminVerificarToken_(idToken);
  const ss = SpreadsheetApp.openById(ID_PLANILHA);
  const sh = ss.getSheetByName("Histórico administrativo");
  if (!sh || sh.getLastRow() < 2) return { ok: true, registros: [] };
  const dados = sh.getDataRange().getDisplayValues();
  const registros = dados.slice(1).reverse().slice(0, 200).map(l => ({
    data: l[0] || "",
    email: l[1] || "",
    acao: l[2] || "",
    nome: l[3] || "",
    detalhes: l[4] || ""
  }));
  return { ok: true, registros: registros };
}

function adminVerificarToken_(idToken) {
  if (!idToken || typeof idToken !== "string") throw new Error("Faça login com uma conta Google autorizada.");
  const resposta = UrlFetchApp.fetch(
    "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );
  if (resposta.getResponseCode() !== 200) throw new Error("Sessão Google inválida. Entre novamente.");
  const info = JSON.parse(resposta.getContentText());
  const email = String(info.email || "").toLowerCase();
  if (info.aud !== ADMIN_OAUTH_CLIENT_ID || info.email_verified !== "true" ||
      !ADMIN_EMAILS.includes(email)) {
    throw new Error("Esta conta Google não está autorizada a acessar o painel.");
  }
  return { email: email };
}

function adminValor_(sh, linha, cabecalhos, titulo) {
  const i = cabecalhos.indexOf(titulo);
  return i < 0 ? "" : sh.getRange(linha, i + 1).getDisplayValue();
}

function adminRegistrarHistorico_(ss, email, acao, nome, detalhes) {
  let sh = ss.getSheetByName("Histórico administrativo");
  if (!sh) sh = ss.insertSheet("Histórico administrativo");
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Data", "Responsável", "Ação", "Nome do membro", "Detalhes"]);
    sh.setFrozenRows(1);
  }
  sh.appendRow([new Date(), email, acao, nome, detalhes]);
}
