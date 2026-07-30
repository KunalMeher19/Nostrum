// Request validation middleware — validates body/params/query against a schema.

const validate = (schema) => (req, res, next) => {
  // TODO: plug in a validator (e.g. zod / joi / express-validator)
  next();
};

module.exports = { validate };
