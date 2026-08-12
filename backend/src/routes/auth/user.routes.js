import {Router} from "express"
import {
  registerUser, 
  loginUser, 
  forgotPasswordRequest,
  passwordResetRequest
} from "../../controllers/auth/user.controller.js"

const router = Router()

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/forgot-password').post(forgotPasswordRequest)
router.route('/reset-password/:resetToken').post(passwordResetRequest)

export default router
