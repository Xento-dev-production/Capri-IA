// ===== Saisie vocale de Capri (côté principal) : transcription Whisper en local =====
// Le modèle est téléchargé une seule fois (environ 250 Mo) au premier usage, puis tout marche hors ligne.
const { ipcMain, app } = require('electron');
const path = require('path');

const MODELE = 'Xenova/whisper-small';
let promesse = null;

function charger() {
  if (!promesse) {
    promesse = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.cacheDir = path.join(app.getPath('userData'), 'modeles_whisper');
      return pipeline('automatic-speech-recognition', MODELE, { dtype: 'q8' });
    })();
    promesse.catch(() => { promesse = null; }); // en cas d'échec, on pourra réessayer
  }
  return promesse;
}

// Dès que tu appuies sur le micro, on commence à charger le modèle pendant que tu parles
ipcMain.on('micro-prechauffe', () => { charger().catch(() => {}); });

ipcMain.handle('micro-transcrire', async (e, audio) => {
  try {
    const p = await charger();
    const sortie = await p(new Float32Array(audio), { language: 'french', task: 'transcribe', chunk_length_s: 30 });
    return { texte: String(sortie.text || '').trim() };
  } catch (err) {
    const code = err && (err.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find package/.test(String(err.message))) ? 'MODULE' : String((err && err.message) || err).slice(0, 120);
    return { erreur: code };
  }
});

// Le fichier est chargé avec require(...)() depuis main.js : on exporte donc une fonction (la mise en place est déjà faite plus haut)
module.exports = function () {};
