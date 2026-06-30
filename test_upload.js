import http from 'http';
import { Buffer } from 'buffer';

const uploadTemplate = (cat) => {
  return new Promise((resolve, reject) => {
    // 1. Download template
    http.get(`http://localhost:3000/api/standard-maintenance/template/${cat}`, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download template for ${cat}: ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        
        // 2. Upload template
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const kategori = cat.toUpperCase();
        
        const filename = `template_${cat}.xlsx`;
        
        // Construct multipart form data body manually
        let part1 = `--${boundary}\r\n`;
        part1 += `Content-Disposition: form-data; name="kategori"\r\n\r\n`;
        part1 += `${kategori}\r\n`;
        
        part1 += `--${boundary}\r\n`;
        part1 += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
        part1 += `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`;
        
        const part2 = `\r\n--${boundary}--\r\n`;
        
        const bodyBuffer = Buffer.concat([
          Buffer.from(part1, 'utf8'),
          buffer,
          Buffer.from(part2, 'utf8')
        ]);
        
        const req = http.request({
          host: 'localhost',
          port: 3000,
          path: '/api/standard-maintenance/import',
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': bodyBuffer.length
          }
        }, (uploadRes) => {
          let uploadData = '';
          uploadRes.on('data', (c) => uploadData += c);
          uploadRes.on('end', () => {
            console.log(`Upload response for ${cat}: Status ${uploadRes.statusCode}`);
            console.log(`Upload Response body:`, uploadData);
            resolve();
          });
        });
        
        req.on('error', reject);
        req.write(bodyBuffer);
        req.end();
      });
    }).on('error', reject);
  });
};

const run = async () => {
  try {
    for (const cat of ['hardware', 'software_hw', 'application', 'network_cyber']) {
      await uploadTemplate(cat);
    }
    console.log('✓ All uploads verified.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

run();
