const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * رفع صور وفيديوهات العميل (owner/admin) — صور الهيرو والأصناف والمعرض.
 * الملفات في public/uploads/restaurants وبتتخدم عبر /uploads/ (static مسجل في app.js).
 * الرابط النهائي يتحفظ في draft كـ heroImage / image / gallery.
 */
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/restaurants');
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const ALLOWED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const ALLOWED_VIDEO = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

const KIND_BY_EXT = {
  '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.webp': 'image', '.gif': 'image', '.avif': 'image',
  '.mp4': 'video', '.webm': 'video', '.mov': 'video',
};

function ensureDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function uploadsRoutes(fastify, opts, done) {
  fastify.post('/uploads', { preHandler: [fastify.authMiddleware] }, async (request, reply) => {
    try {
      const part = await request.file();
      if (!part) return reply.status(400).send({ ok: false, error: 'file required', code: 'VALIDATION' });
      const mime = String(part.mimetype || '').toLowerCase();
      const isImage = ALLOWED_IMAGE.has(mime);
      const isVideo = ALLOWED_VIDEO.has(mime);
      if (!isImage && !isVideo) {
        return reply.status(400).send({ ok: false, error: 'نوع الملف غير مدعوم (صور أو فيديو فقط)', code: 'VALIDATION' });
      }
      const ext = EXT_BY_MIME[mime] || path.extname(part.filename || '').toLowerCase() || (isVideo ? '.mp4' : '.jpg');
      const buffers = [];
      let size = 0;
      const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      for await (const chunk of part.file) {
        size += chunk.length;
        if (size > limit) {
          return reply.status(400).send({ ok: false, error: isVideo ? 'الفيديو أكبر من 40MB' : 'الصورة أكبر من 5MB', code: 'VALIDATION' });
        }
        buffers.push(chunk);
      }
      ensureDir();
      const name = `${crypto.randomUUID().replace(/-/g, '')}-${Date.now()}${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.concat(buffers));
      return reply.status(201).send({ ok: true, data: { url: `/uploads/restaurants/${name}`, filename: name, mime, size, kind: isVideo ? 'video' : 'image' } });
    } catch (err) {
      return reply.status(err.status || 500).send({ ok: false, error: err.message });
    }
  });

  // مكتبة الميديا المرفوعة للعميل (الصور/الفيديوهات في مجلد restaurants)
  fastify.get('/uploads', { preHandler: [fastify.authMiddleware] }, async (request, reply) => {
    try {
      const items = [];
      if (fs.existsSync(UPLOAD_DIR)) {
        for (const file of fs.readdirSync(UPLOAD_DIR)) {
          if (file.startsWith('.')) continue;
          const full = path.join(UPLOAD_DIR, file);
          let stat;
          try { stat = fs.statSync(full); } catch { continue; }
          if (!stat.isFile()) continue;
          const kind = KIND_BY_EXT[path.extname(file).toLowerCase()];
          if (!kind) continue;
          items.push({
            url: `/uploads/restaurants/${file}`,
            filename: file,
            kind,
            size: stat.size,
            mtime: stat.mtime.getTime(),
            source: 'restaurants',
          });
        }
      }
      items.sort((a, b) => b.mtime - a.mtime);
      return reply.send({ ok: true, data: items.slice(0, 120) });
    } catch (err) {
      return reply.status(err.status || 500).send({ ok: false, error: err.message });
    }
  });
  done();
}

module.exports = uploadsRoutes;
