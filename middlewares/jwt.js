let jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET;
const apiResponse = require("../helpers/apiResponse");

const validateToken = (req, res, next) => {
		const authorizationHeader = req.headers.authorization;
		let result;
		if (authorizationHeader) {
			const token = req.headers.authorization.split(' ')[1]; // Bearer <token>
			const options = {
				expiresIn: '1d',
				maxAge: '1d',
			};

			// verify makes sure that the token hasn't expired and has been issued by us
			jwt.verify(token, secret, options, function (err, decoded){
				if (err) {
					apiResponse.ErrorResponse(res, err.message);
				} else {
					// Let's pass back the decoded token to the request object
					req.user = decoded;

					// We call next to pass execution to the subsequent middleware
					next();
				}
			});
		} else {
			result = {
				error: `Authentication error. Token required.`,
				status: 401
			};
			res.status(401).send(result);
		}
	}
module.exports = validateToken;
