
export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mimeType, prompt } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: Missing Anthropic API Key' });
  }

  try {
    // Llamada directa a la API de Anthropic usando fetch (Node.js 18+)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307", // Modelo rápido y económico
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: image // La imagen base64 ya viene limpia desde el frontend
                }
              },
              {
                type: "text",
                text: prompt + " Responde SOLO con el JSON crudo, sin markdown ```json ```."
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Anthropic API Error: ${errorData}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    return res.status(200).json({ text: content });

  } catch (error) {
    console.error('Error in fallback function:', error);
    return res.status(500).json({ error: error.message });
  }
}
