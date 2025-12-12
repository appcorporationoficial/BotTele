import fetch from "node-fetch";
import TelegramBot from "node-telegram-bot-api";

const TOKEN = "8121001473:AAHr1BaTJexGSMjACSiycPzeZi698FmzYNA";
const CHAT_ID = "-1003042372516";

const bot = new TelegramBot(TOKEN, { polling: false });

const URL_JSON = "https://golazoplay.com/agenda.json?v=1.06";

// Guardamos partidos ya publicados
const publicados = new Set();

async function obtenerAgenda() {
  try {
    const res = await fetch(URL_JSON);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Error al obtener JSON:", err);
    return [];
  }
}

function convertirFechaHora(date, hour) {
  return new Date(`${date}T${hour}`);
}

async function revisarPartidos() {
  const agenda = await obtenerAgenda();
  const ahora = new Date();

  for (const item of agenda) {
    const a = item.attributes;

    const fechaPartido = a.date_diary;       // "2025-12-11"
    const horaPartido = a.diary_hour;        // "21:00:00"
    const descPartido = a.diary_description; // "NHL: ..."
    
    const fechaHora = convertirFechaHora(fechaPartido, horaPartido);

    // 30 minutos antes
    const fechaAviso = new Date(fechaHora.getTime() - 30 * 60000);

    // ID único del partido
    const idUnico = `${fechaPartido}_${horaPartido}_${descPartido}`;

    // Verificar si ya se publicó
    if (publicados.has(idUnico)) continue;

    // Si ya pasó el tiempo de aviso, publicar
    if (ahora >= fechaAviso && ahora < fechaHora) {
      const mensaje = `📅 *${fechaPartido}*\n⏰ *${horaPartido}*\n🏒 ${descPartido}`;
      
      await bot.sendMessage(CHAT_ID, mensaje, { parse_mode: "Markdown" });

      console.log("Publicado:", mensaje);
      publicados.add(idUnico);
    }
  }
}

// Revisar cada minuto
setInterval(revisarPartidos, 60 * 1000);

console.log("⏳ Bot iniciado, esperando el momento de publicar...");