import http from 'http';

http.get('http://localhost:3000/api/standard-maintenance/years', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Data:', data);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
