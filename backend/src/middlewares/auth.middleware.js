// Auth middleware — verifies JWT / session and attaches req.user.
// TODO: implement when auth is wired up (email/password + Google OAuth per §8).

const requireAuth = (req, res, next) => {
  // TODO: verify token
  next();
};

module.exports = { requireAuth };
