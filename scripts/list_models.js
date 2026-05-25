const axios = require('axios');
(async () => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.error('GEMINI_API_KEY não definido no ambiente');
      process.exit(2);
    }
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    else console.error(e.message);
    process.exit(1);
  }
})();
