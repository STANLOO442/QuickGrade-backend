import Lecturer from '../model/lecturerModel'
import { type Request, type Response, type NextFunction } from 'express'
import bcyrpt from 'bcryptjs'
import type { AuthenticatedRequest } from '../../extender'
import { transporter } from '../utils/emailsender'

export const lecturerSignup = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { faculty, department, password, email } = req.body
    const existingLecturer = await Lecturer.findOne({ where: { email } })

    if (existingLecturer) {
      res.json({
        existingLecturerError: 'Lecturer already exists'
      })
    } else {
      const hashedPassword = await bcyrpt.hash(password, 12)
      const noOfLecturer = (await Lecturer.count() + 1).toString().padStart(4, '0')
      const employeeID = `LT${faculty.toUpperCase().slice(0, 4)}/${noOfLecturer}`
      console.log('employeeID', employeeID)

      const createdLecturer = await Lecturer.create({
        faculty,
        department,
        password: hashedPassword,
        email,
        employeeID
      })
      // sending employeeID  and password to student email
      if (!createdLecturer) {
        console.log('Lecturer not created')
        res.json({
          failedSignup: 'Lecturer signup failed'
        })
      } else {
        req.session.email = email
        console.log('req.session.email', req.session.email)
        const lecturerDetail = await Lecturer.findOne({ where: { email } })

        if (!lecturerDetail) {
          res.json({ lecturerNotFoundError: 'student record not found' })
        } else {
          const lecturerDetail = await Lecturer.findOne({ where: { email } })
          if (!lecturerDetail) {
            console.log('Lecturer not found after signup')
            res.json({ lecturerNotFoundError: 'Lecturer not found' })
          } else {
            const mailOptions = {
              from: {
                name: 'QuickGrade App',
                address: 'quickgradedecagon@gmail.com'
              },
              to: email,
              subject: 'Quick Grade App - Login Details',
              text: 'Login Detail',
              html: `<h3>Hi there,
          Your Account has been successfully created. kindly find your login details below:</h3>
          <h1> EmployeeID: ${lecturerDetail.dataValues.employeeID}</h1>
          <h1> Password: ${password}</h1>

          Best regards,
          <h3>The QuickGrade Team</h3>`
            }

            await transporter.sendMail(mailOptions)
            console.log('successs')
            req.session.email = email
            res.json({ successfulSignup: 'Lecturer signup successful' })

            //   const totpSecret = speakeasy.generateSecret({ length: 20 })

            //   // Update the student instance with TOTP details
            //   await lecturerDetail.update({
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
            //     text: `TOTP: ${lecturerDetail.otp}`,
            //     html: `<h3>Hi there,
            // Thank you for signing up for QuickGrade. Copy OTP below to verify your email:</h3>
            // <h1>${lecturerDetail.otp}</h1>
            // <h3>This OTP will expire in 10 minutes. If you did not sign up for a QuickGrade account,
            // you can safely ignore this email.
            // Best,
            // The QuickGrade Team</h3>`
            //   }

            //   await transporter.sendMail(mailOptions)
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Error creating lecturer:', error)

    res.status(500).json({
      message: ` error: ${error}`
    })
  }
}

export const lecturerLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('req', req.body)
  const { employeeID, password } = req.body

  try {
    const existingLecturer = await Lecturer.findOne({ where: { employeeID } })

    if (!existingLecturer) {
      res.json({
        lecturerNotFoundError: 'Invalid lecturerId'
      })
    } else {
      const isPasswordValid = await bcyrpt.compare(
        password,
        existingLecturer.dataValues.password
      )
      if (!isPasswordValid) {
        res.status(401).json({
          inValidPassword: 'Invalid password'
        })
      }

      res.json({
        successfulLogin: 'login successful'
      })
    }
  } catch (error: any) {
    console.error('Error during lecturer login:', error)

    res.status(500).json({
      internalServerError: `Error: ${error}`
    })
  }
}

export const verifyOTP = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    console.log('req.body', req.body)
    const { otp } = req.body
    const email = req.session.email
    console.log('email', email)
    const lecturerDetail = await Lecturer.findOne({ where: { email, otp } })

    if (!lecturerDetail) {
      res.json({ lecturerNotSignupError: 'User not signed up' })
    } else {
      const now = new Date()
      if (now > lecturerDetail.otpExpiration) {
        res.json({ expiredOtpError: 'OTP has expired' })
        return
      }

      await lecturerDetail.update({ isVerified: true })

      res.json({ OtpVerificationSuccess: 'OTP verified successfully' })
    }
  } catch (error) {
    console.error(error)
    res.json({ internalServerError: 'Internal Server Error' })
  }
}

export const updateLecturerPassword = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params
  const { newPassword } = req.body

  try {
    // Find the user by ID
    const user = await Lecturer.findByPk(userId)

    if (!user) {
      res.status(404).json({ error: 'User not found' })
    } else {
      user.dataValues.password = newPassword

      // Save the updated user to the database
      await user.save()

      res.status(200).json({ message: 'Password updated successfully' })
    }

    // Update the user's password
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
