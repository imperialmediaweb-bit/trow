import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/error-handler.js';

export const blogRouter = Router();

// ─── Public Endpoints ────────────────────────────────────────

// GET /blog/posts - List published posts
blogRouter.get('/posts', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const offset = (page - 1) * limit;

  await ensureBlogTable();

  const result = await pool.query(
    `SELECT id, title, slug, excerpt, cover_image, author_name, tags, published_at, created_at
     FROM blog_posts WHERE is_published = true
     ORDER BY published_at DESC NULLS LAST, created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );

  const countResult = await pool.query('SELECT COUNT(*) FROM blog_posts WHERE is_published = true');
  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    data: result.rows,
    meta: { page, per_page: limit, total, total_pages: Math.ceil(total / limit) },
  });
}));

// GET /blog/posts/:slug - Get single post by slug
blogRouter.get('/posts/:slug', asyncHandler(async (req: Request, res: Response) => {
  await ensureBlogTable();

  const result = await pool.query(
    `SELECT id, title, slug, content, excerpt, cover_image, author_name, tags, meta_title, meta_description, published_at, created_at
     FROM blog_posts WHERE slug = $1 AND is_published = true`,
    [req.params.slug],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'POST_NOT_FOUND', 'Blog post not found');
  }

  // Increment view count
  await pool.query('UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = $1', [req.params.slug]);

  res.json({ success: true, data: result.rows[0] });
}));

// ─── Admin Endpoints ─────────────────────────────────────────

// GET /blog/admin/posts - List all posts (including drafts)
blogRouter.get('/admin/posts', authenticate, requireRole('admin', 'superadmin'), asyncHandler(async (req: Request, res: Response) => {
  await ensureBlogTable();

  const result = await pool.query(
    `SELECT id, title, slug, excerpt, is_published, author_name, tags, view_count, published_at, created_at, updated_at
     FROM blog_posts ORDER BY created_at DESC`,
  );

  res.json({ success: true, data: result.rows });
}));

// POST /blog/admin/posts - Create post
blogRouter.post('/admin/posts', authenticate, requireRole('admin', 'superadmin'), asyncHandler(async (req: Request, res: Response) => {
  await ensureBlogTable();

  const { title, content, excerpt, cover_image, author_name, tags, is_published, meta_title, meta_description } = req.body;

  if (!title || !content) {
    throw new AppError(400, 'MISSING_FIELDS', 'Title and content are required');
  }

  const id = uuidv4();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const result = await pool.query(
    `INSERT INTO blog_posts (id, title, slug, content, excerpt, cover_image, author_name, tags, is_published, meta_title, meta_description, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      id, title, slug, content,
      excerpt || content.replace(/<[^>]*>/g, '').slice(0, 200),
      cover_image || null,
      author_name || req.user?.email || 'Admin',
      JSON.stringify(tags || []),
      is_published || false,
      meta_title || title,
      meta_description || excerpt || '',
      is_published ? new Date() : null,
    ],
  );

  res.status(201).json({ success: true, data: result.rows[0] });
}));

// PUT /blog/admin/posts/:id - Update post
blogRouter.put('/admin/posts/:id', authenticate, requireRole('admin', 'superadmin'), asyncHandler(async (req: Request, res: Response) => {
  const { title, content, excerpt, cover_image, author_name, tags, is_published, meta_title, meta_description } = req.body;

  const current = await pool.query('SELECT is_published FROM blog_posts WHERE id = $1', [req.params.id]);
  if (current.rowCount === 0) {
    throw new AppError(404, 'POST_NOT_FOUND', 'Blog post not found');
  }

  // Set published_at when first published
  const wasPublished = current.rows[0].is_published;
  const publishedAt = is_published && !wasPublished ? new Date() : undefined;

  const result = await pool.query(
    `UPDATE blog_posts SET
       title = COALESCE($1, title),
       content = COALESCE($2, content),
       excerpt = COALESCE($3, excerpt),
       cover_image = COALESCE($4, cover_image),
       author_name = COALESCE($5, author_name),
       tags = COALESCE($6, tags),
       is_published = COALESCE($7, is_published),
       meta_title = COALESCE($8, meta_title),
       meta_description = COALESCE($9, meta_description),
       published_at = COALESCE($10, published_at),
       updated_at = NOW()
     WHERE id = $11 RETURNING *`,
    [
      title, content, excerpt, cover_image, author_name,
      tags ? JSON.stringify(tags) : null,
      is_published, meta_title, meta_description,
      publishedAt, req.params.id,
    ],
  );

  res.json({ success: true, data: result.rows[0] });
}));

// DELETE /blog/admin/posts/:id
blogRouter.delete('/admin/posts/:id', authenticate, requireRole('admin', 'superadmin'), asyncHandler(async (req: Request, res: Response) => {
  const result = await pool.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id', [req.params.id]);

  if (result.rowCount === 0) {
    throw new AppError(404, 'POST_NOT_FOUND', 'Blog post not found');
  }

  res.json({ success: true, data: { message: 'Post deleted' } });
}));

// ─── Helpers ─────────────────────────────────────────────────

async function ensureBlogTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id UUID PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      slug VARCHAR(500) UNIQUE NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      excerpt TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      author_name VARCHAR(255) DEFAULT 'Admin',
      tags JSONB DEFAULT '[]',
      is_published BOOLEAN DEFAULT false,
      view_count INTEGER DEFAULT 0,
      meta_title VARCHAR(500) DEFAULT '',
      meta_description TEXT DEFAULT '',
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
