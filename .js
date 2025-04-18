// index.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Create a capsule
app.post('/create', upload.single('media'), async (req, res) => {
  const { user_id, title, message, unlock_date } = req.body;
  let media_url = null;

  // Upload media to Supabase Storage
  if (req.file) {
    const fileExt = req.file.originalname.split('.').pop();
    const filePath = ${Date.now()}.${fileExt};

    const { data, error } = await supabase.storage
      .from('capsule_media')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) return res.status(500).json({ error });
    media_url = data?.path;
  }

  const { data: capsule, error } = await supabase
    .from('time_capsules')
    .insert([{ user_id, title, message, unlock_date, media_url }])
    .select();

  if (error) return res.status(500).json({ error });
  res.status(200).json({ capsule });
});

// View capsule (if unlocked)
app.get('/capsule/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error });

  const isUnlocked = new Date() >= new Date(data.unlock_date);
  res.json({ ...data, isUnlocked });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
