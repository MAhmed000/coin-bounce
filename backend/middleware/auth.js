const JWTService = require("../services/JWTService");
const User = require("../models/user");
const UserDTO = require("../dto/user");

const auth = async (req, res, next) => {
  try {
    // 1. Refresh, Access Token Validate
    const { accesstoken, refreshtoken } = req.cookies;

    if (!refreshtoken || !accesstoken) {
      const error = {
        status: 401,
        message: "Unauthorized",
      };
      return next(error);
    }
    let _id;
    try {
      _id = JWTService.verifyAccessToken(accesstoken)._id;
    } catch (error) {
      return next(error);
    }

    // Check User In Our Database
    let user;
    try {
      user = await User.findOne({ _id });
    } catch (error) {
      return next(error);
    }
    const userDto = new UserDTO(user);
    req.user = userDto;
    next();
  } catch (error) {return next(error);}
};

module.exports = auth;
