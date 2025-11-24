export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Método no permitido" });

  const { prompt, model } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Falta prompt" });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return res.status(500).json({ error: "Falta GEMINI_API_KEY en Vercel" });

    // EJEMPLO simulando llamada (cámbialo luego por tu endpoint real)
    const response = {
      text: `Resultado generado para: ${prompt}`
    };

    return res.status(200).json(response);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno de servidor" });
  }
}
