// studyNotesRoutes.js – Express router for Study Notes feature
// This file defines the core API endpoints for managing the hierarchy and resources.
// It uses the Supabase client instance passed from the main app.

const express = require('express');
const router = express.Router();

// Simple admin middleware placeholder – in production replace with proper auth & role check.
function adminAuth(req, res, next) {
  // Expect a Supabase JWT in Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing auth token' });
  }
  const token = authHeader.split(' ')[1];
  // For demo we just verify token exists; real implementation should verify with supabase.auth.getUser.
  req.supabaseToken = token;
  next();
}

/**
 * Helper to get supabase client with auth context.
 * The main app creates a base supabase client (without auth) – we clone it with the request token.
 */
function getSupabase(req) {
  // The base client is attached to app.locals.supabase in index.js.
  const base = req.app.locals.supabase;
  if (!base) return null;
  return base;
}

/* ---------- Branches ---------- */
router.get('/branches', async (req, res) => {
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('branches').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/branches', adminAuth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Branch name required' });
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('branches').insert({ name }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

/* ---------- Semesters ---------- */
router.get('/semesters', async (req, res) => {
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('semesters').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/semesters', adminAuth, async (req, res) => {
  const { branch_id, number } = req.body;
  if (!branch_id || !number) return res.status(400).json({ error: 'branch_id and number required' });
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('semesters').insert({ branch_id, number }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

/* ---------- Subjects ---------- */
router.get('/subjects', async (req, res) => {
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('subjects').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/subjects', adminAuth, async (req, res) => {
  const { semester_id, name } = req.body;
  if (!semester_id || !name) return res.status(400).json({ error: 'semester_id and name required' });
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('subjects').insert({ semester_id, name }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

/* ---------- Units ---------- */
router.get('/units', async (req, res) => {
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('units').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/units', adminAuth, async (req, res) => {
  const { subject_id, title, number } = req.body;
  if (!subject_id || !title || typeof number !== 'number') return res.status(400).json({ error: 'subject_id, title, number required' });
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('units').insert({ subject_id, title, number }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

/* ---------- Chapters ---------- */
router.get('/chapters', async (req, res) => {
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('chapters').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/chapters', adminAuth, async (req, res) => {
  const { unit_id, title, number, difficulty } = req.body;
  if (!unit_id || !title || typeof number !== 'number') return res.status(400).json({ error: 'unit_id, title, number required' });
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('chapters').insert({ unit_id, title, number, difficulty }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

/* ---------- Resources ---------- */
router.get('/chapters/:cid/resources', async (req, res) => {
  const { cid } = req.params;
  const supabase = getSupabase(req);
  const { data, error } = await supabase
    .from('chapter_resources')
    .select('*, resource_types(name, icon)')
    .eq('chapter_id', cid);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Upload resource – expects multipart/form-data with fields: type_id, file (binary)
// For simplicity, we use express raw body; in production use multer or similar.
router.post('/chapters/:cid/resources', adminAuth, async (req, res) => {
  // This placeholder expects JSON with file_path already uploaded to Supabase bucket via client-side SDK.
  const { cid } = req.params;
  const { type_id, file_path, file_name, mime_type, size_bytes } = req.body;
  if (!type_id || !file_path || !file_name || !mime_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const supabase = getSupabase(req);
  const { data, error } = await supabase.from('chapter_resources').insert({
    chapter_id: cid,
    type_id,
    file_path,
    file_name,
    mime_type,
    size_bytes,
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// Generate signed URL for viewing/downloading a resource
router.get('/resources/:rid/signed-url', async (req, res) => {
  const { rid } = req.params;
  const supabase = getSupabase(req);
  // Fetch resource meta
  const { data: resource, error: fetchErr } = await supabase
    .from('chapter_resources')
    .select('file_path')
    .eq('id', rid)
    .single();
  if (fetchErr) return res.status(404).json({ error: 'Resource not found' });
  // Create signed URL (1 hour = 3600 seconds)
  const { data: signed, error: signErr } = await supabase.storage
    .from('study-notes-private')
    .createSignedUrl(resource.file_path, 3600);
  if (signErr) return res.status(500).json({ error: signErr.message });
  // Increment view counter
  await supabase
    .from('chapter_resources')
    .update({ views: supabase.rpc('increment', { column: 'views', id: rid }) })
    .eq('id', rid);
  res.json({ url: signed?.signedUrl });
});

/* ---------- Hierarchy ---------- */
router.get('/hierarchy', async (req, res) => {
  const supabase = getSupabase(req);
  
  const [branchesRes, semestersRes, subjectsRes, unitsRes, chaptersRes] = await Promise.all([
    supabase.from('branches').select('*'),
    supabase.from('semesters').select('*'),
    supabase.from('subjects').select('*'),
    supabase.from('units').select('*'),
    supabase.from('chapters').select('*')
  ]);

  if (branchesRes.error) return res.status(500).json({ error: branchesRes.error.message });
  if (semestersRes.error) return res.status(500).json({ error: semestersRes.error.message });
  if (subjectsRes.error) return res.status(500).json({ error: subjectsRes.error.message });
  if (unitsRes.error) return res.status(500).json({ error: unitsRes.error.message });
  if (chaptersRes.error) return res.status(500).json({ error: chaptersRes.error.message });

  const branches = branchesRes.data || [];
  const semesters = semestersRes.data || [];
  const subjects = subjectsRes.data || [];
  const units = unitsRes.data || [];
  const chapters = chaptersRes.data || [];

  const hierarchy = branches.map(branch => {
    return {
      id: branch.id,
      name: branch.name,
      semesters: semesters
        .filter(sem => sem.branch_id === branch.id)
        .map(sem => {
          return {
            id: sem.id,
            number: sem.number,
            subjects: subjects
              .filter(sub => sub.semester_id === sem.id)
              .map(sub => {
                return {
                  id: sub.id,
                  name: sub.name,
                  units: units
                    .filter(unit => unit.subject_id === sub.id)
                    .map(unit => {
                      return {
                        id: unit.id,
                        title: unit.title,
                        number: unit.number,
                        chapters: chapters
                          .filter(chap => chap.unit_id === unit.id)
                          .map(chap => ({
                            id: chap.id,
                            title: chap.title,
                            number: chap.number,
                            difficulty: chap.difficulty
                          }))
                      };
                    })
                };
              })
          };
        })
    };
  });

  res.json({ branches: hierarchy });
});

/* ---------- Chapter Details ---------- */
router.get('/chapter/:cid', async (req, res) => {
  const { cid } = req.params;
  const supabase = getSupabase(req);

  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', cid)
    .single();

  if (chapterError) return res.status(404).json({ error: 'Chapter not found' });

  const { data: resources, error: resourcesError } = await supabase
    .from('chapter_resources')
    .select('*, resource_types(name, icon)')
    .eq('chapter_id', cid);

  if (resourcesError) return res.status(500).json({ error: resourcesError.message });

  res.json({ chapter, resources });
});

module.exports = router;
