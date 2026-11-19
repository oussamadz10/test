// GET /api/config – configuration publique pour le navigateur (la clé "anon" Supabase est publique par conception).
'use strict';
const S = require('../lib/server');
module.exports = (req, res) => {
    S.send(res, 200, { supabaseUrl: S.env('SUPABASE_URL'), supabaseAnonKey: S.env('SUPABASE_ANON_KEY'), payments: !!S.env('STRIPE_SECRET_KEY') });
};
