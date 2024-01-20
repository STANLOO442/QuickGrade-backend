import jwt from 'jsonwebtoken'
import Student from '../model/studentModel'
import { type Request, type Response, type NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { transporter } from '../utils/emailsender'
import { type AuthenticatedRequest } from '../../extender'
import crypto from 'crypto'
const secret: string = (process.env.secret ?? '')

export const studentSignup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('req', req.body)
    const { faculty, email, department, password } = req.body

    const existingStudent = await Student.findOne({ where: { email } })

    if (existingStudent) {
      console.log('user already exists')
      res.json({
        existingStudentError: 'Student already exists'
      })
    } else {
      const noOfStudent = (await Student.count() + 1).toString().padStart(4, '0')
      const matricNo = `${faculty.toUpperCase().slice(0, 3)}/${department.toUpperCase().slice(0, 3)}/${noOfStudent}`

      const hashedPassword = await bcrypt.hash(password, 12)

      const createdStudent = await Student.create({
        faculty,
        department,
        email,
        password: hashedPassword,
        matricNo
      })

      if (!createdStudent) {
        console.log('student not created')
        res.json({
          failedSignup: 'Student signup failed'
        })
      } else {
        const student = await Student.findOne({ where: { email } })

        if (!student) {
          res.json({ studentNotFoundError: 'student record not found' })
          return
        }

        const studentDetail = await Student.findOne({ where: { email } })
        if (!studentDetail) {
          console.log('student not found after signup')
          res.json({ studentNotFoundError: 'student not found' })
        } else {
          req.session.email = email
          const mailOptions = {
            from: {
              name: 'QuickGrade App',
              address: 'quickgradedecagon@gmail.com'
            },
            to: email,
            subject: 'Quick Grade App - Login Details',
            text: 'Login Detail',
            html: `Hi there,<br>
          Your Account has been successfully created. kindly find your login details below:
          <h5> MatricNo: ${studentDetail.dataValues.matricNo}</h5>
          <h5> Password: ${password}</h5>

          Best regards,<br>
          <h5>The QuickGrade Team</h5>`
          }

          await transporter.sendMail(mailOptions)
          console.log('successs')
          res.json({ successfulSignup: 'Student signup successful' })
          //   const totpSecret = speakeasy.generateSecret({ length: 20 })

          //   // Update the student instance with TOTP details
          //   await student.update({
          //     otpSecret: totpSecret.base32,
          //     otp: speakeasy.totp({
          //       secret: totpSecret.base32,
          //       encoding: 'base32'
          //     }),
          //     otpExpiration: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
          //   })

          //   const mailOptions = {
          //     from: {
          //       name: 'QuickGrade App',
          //       address: 'quickgradedecagon@gmail.com'
          //     },
          //     to: email,
          //     subject: 'Quick Grade App - Email Verification Code',
          //     text: `TOTP: ${student.otp}`,
          //     html: `<h3>Hi there,
          // Thank you for signing up for QuickGrade. Copy OTP below to verify your email:</h3>
          // <h1>${student.otp}</h1>
          // <h3>This OTP will expire in 10 minutes. If you did not sign up for a QuickGrade account,
          // you can safely ignore this email.
          // Best,
          // The QuickGrade Team</h3>`
          //   }
        }
      }
    }
  } catch (error) {
    console.error('Error creating student: ', error)
    res.json({
      InternaServerError: 'Internal server error'
    })
  }
}

export const verifyOTP = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('req.body', req.body)
    const { otp } = req.body
    const email = req.session.email
    console.log('email', email)
    const student = await Student.findOne({ where: { email, otp } })

    if (!student) {
      res.json({ studentNotSignupError: 'User not signed up' })
    } else {
      const now = new Date()
      if (now > student.otpExpiration) {
        res.json({ expiredOtpError: 'OTP has expired' })
        return
      }

      await student.update({ isVerified: true })

      res.json({ OtpVerificationSuccess: 'OTP verified successfully' })
    }
  } catch (error) {
    console.error(error)
    res.json({ internalServerError: 'Internal Server Error' })
  }
}

export const studentLogin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { matricNo, password } = req.body
    const existingStudent = await Student.findOne({ where: { matricNo } })
    const email = existingStudent?.dataValues.email
    req.session.email = email
    console.log('ssession', req.session.email)
    if (!existingStudent) {
      res.status(404).json({
        studentNotFoundError: 'Student not found'
      })
    } else {
      const isPasswordValid = await bcrypt.compare(password, existingStudent.dataValues.password)

      if (!isPasswordValid) {
        res.status(401).json({
          inValidPassword: 'Invalid password'
        })
      } else {
        const token = jwt.sign({ loginkey: existingStudent.dataValues.studentId }, secret, { expiresIn: '1h' })

        res.cookie('token', token, { httpOnly: true, secure: true })
        // pass in the token into the sessions

        res.json({
          successfulLogin: 'Login successful'
        })
      }
    }
  } catch (error: any) {
    console.error('Error during student login:', error)

    res.status(500).json({
      internalServerError: `Error: ${error}`
    })
  }
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body
  const user = await Student.findOne({ where: { email } })

  if (!user) {
    res.json({ studentNotFoundError: 'User not found' })
    return
  }

  const token = crypto.randomBytes(20).toString('hex')
  user.resetPasswordToken = token
  user.resetPasswordExpiration = new Date(Date.now() + 3600000) // 1 hour
  await user.save()

  
  const mailOptions = {
    from: 'quickgradedecagon@gmail.com',
    to: email,
    subject: 'Password Reset',
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process within one hour of receiving it:\n\nhttp://${req.headers.host}/reset-password/${token}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`
  }

  await transporter.sendMail(mailOptions)

  res.json({ linkSentSuccessfully: 'An email has been sent to the address provided with further instructions.' })
}

export const resetPasswordToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params
  const { password } = req.body

  const user = await Student.findOne({ where: { resetPasswordToken: token } })

  if (!user) {
    res
      .status(404)
      .json({ error: 'Password reset token is invalid or has expired.' })
    return
  }

  if (!user.resetPasswordExpiration || Date.now() > user.resetPasswordExpiration.getTime()) {
    res
      .status(401)
      .json({ error: 'Password reset token is invalid or has expired.' })
    return
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  user.password = hashedPassword

  user.resetPasswordToken = null
  user.resetPasswordExpiration = null
  await user.save()

  res.json({ message: 'Your password has been reset!' })
}

export const updateStudentPassword = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params
  const { newPassword } = req.body

  try {
    // Find the user by ID
    const user = await Student.findByPk(userId)

    if (!user) {
      res.status(404).json({ error: 'User not found' })
    } else {
      // Update the user's password
      user.dataValues.password = newPassword

      // Save the updated user to the database
      await user.save()

      res.status(200).json({ message: 'Password updated successfully' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
