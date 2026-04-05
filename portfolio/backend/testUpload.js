const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

(async () => {
  try {
    const form = new FormData();
    form.append('title', 'debug');
    form.append('content', 'test');
    form.append('images', fs.createReadStream('testfile.txt'));

    const res = await axios.post('http://localhost:4000/api/blogs/force-post', form, {
      headers: form.getHeaders()
    });
    console.log('response', res.data);
  } catch (err) {
    console.error('error', err.response ? err.response.data : err.message);
  }
})();