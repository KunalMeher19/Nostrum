// Database connection setup.
// Wire up Postgres (Neon/Supabase) or the chosen store here per NOSTRUM-DESIGN.md §15.

const connectDb = async () => {
  // TODO: initialize DB client using process.env.DATABASE_URL
};

module.exports = { connectDb };
