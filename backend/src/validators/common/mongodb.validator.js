import { body, param } from "express-validator";

const mongoIdPathVariableValidator = (id) => {
	return [param(id).notEmpty().isMongoId().withMessage(`Invalid ${id}`)];
};

const mongoIdRequestBodyValidator = (id) => {
	return [body(id).notEmpty().isMongoId().withMessage(`Invalid ${id}`)];
};

export { 
  mongoIdPathVariableValidator, 
  mongoIdRequestBodyValidator 
};
