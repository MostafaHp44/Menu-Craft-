const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { listOverrides, getOverride, upsertOverride, deleteOverride } = require('../services/templateMedia.service');

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads/templates');
const UPLOAD_ROOT = path.join(__dirname, '../../public/uploads');
const MEDIA_KIND_BY_EXT = {
  '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.webp': 'image', '.gif': 'image', '.avif': 'image',
  '.mp4': 'video', '.webm': 'video', '.mov': 'video',
};
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

function ensureDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function listOverridesHandler(request, reply) {
  try {
    const overrides = await listOverrides();
    return reply.send({ ok: true, data: overrides });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function getOverrideHandler(request, reply) {
  try {
    const override = await getOverride(request.params.baseId);
    if (!override) return reply.status(404).send({ ok: false, error: 'لا يوجد تعديل لهذا القالب', code: 'NOT_FOUND' });
    return reply.send({ ok: true, data: override });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function upsertOverrideHandler(request, reply) {
  try {
    const baseId = String(request.params.baseId || '').trim();
    if (!baseId) return reply.status(400).send({ ok: false, error: 'baseId required', code: 'VALIDATION' });
    const override = await upsertOverride(baseId, {
      ...(request.body || {}),
      updated_by: request.user?.userId ?? null,
    });
    return reply.send({ ok: true, data: override });
  } catch (err) {
    return reply.status(err.name === 'ZodError' ? 400 : err.status || 500).send({ ok: false, error: err.message });
  }
}

async function deleteOverrideHandler(request, reply) {
  try {
    const baseId = String(request.params.baseId || '').trim();
    if (!baseId) return reply.status(400).send({ ok: false, error: 'baseId required', code: 'VALIDATION' });
    const result = await deleteOverride(baseId);
    return reply.send({ ok: true, deleted: result.deleted });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

async function uploadHandler(request, reply) {
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
    const target = path.join(UPLOAD_DIR, name);
    fs.writeFileSync(target, Buffer.concat(buffers));
    const url = `/uploads/templates/${name}`;
    return reply.status(201).send({ ok: true, data: { url, filename: name, mime, size, kind: isVideo ? 'video' : 'image' } });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

/** مكتبة الميديا المرفوعة — كل الصور/الفيديوهات في public/uploads (مجلد القوالب ومجلدات المطاعم) */
async function listMediaHandler(request, reply) {
  try {
    const items = [];
    const sources = fs.existsSync(UPLOAD_ROOT)
      ? fs.readdirSync(UPLOAD_ROOT).filter((name) => {
          if (name.startsWith('.')) return false;
          try {
            return fs.statSync(path.join(UPLOAD_ROOT, name)).isDirectory();
          } catch {
            return false;
          }
        })
      : [];
    for (const source of sources) {
      const dir = path.join(UPLOAD_ROOT, source);
      for (const file of fs.readdirSync(dir)) {
        if (file.startsWith('.')) continue;
        const full = path.join(dir, file);
        let stat;
        try {
          stat = fs.statSync(full);
        } catch {
          continue;
        }
        if (!stat.isFile()) continue;
        const kind = MEDIA_KIND_BY_EXT[path.extname(file).toLowerCase()];
        if (!kind) continue;
        items.push({
          url: `/uploads/${source}/${file}`,
          filename: file,
          kind,
          size: stat.size,
          mtime: stat.mtime.getTime(),
          source,
        });
      }
    }
    items.sort((a, b) => b.mtime - a.mtime);
    return reply.send({ ok: true, data: items.slice(0, 120) });
  } catch (err) {
    return reply.status(err.status || 500).send({ ok: false, error: err.message });
  }
}

module.exports = {
  listOverridesHandler,
  getOverrideHandler,
  upsertOverrideHandler,
  deleteOverrideHandler,
  uploadHandler,
  listMediaHandler,
};
