"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const otpSecretMap_1 = __importDefault(require("../utils/otpSecretMap"));
const emailsender_1 = require("../utils/emailsender");
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        // let user: Student | Lecturer | undefined;
        // const student = await Student.findOne({ where: { email } });
        // const lecturer = await Lecturer.findOne({ where: { email } });
        // if (student) {
        //   user = student;
        // } else if (lecturer) {
        //   user = lecturer;
        // }
        // if (!user) {
        //   res.status(404).json({ error: 'User not found' });
        //   return;
        // }
        const totpSecret = speakeasy_1.default.generateSecret({ length: 20 });
        const totpToken = speakeasy_1.default.totp({
            secret: totpSecret.base32,
            encoding: 'base32',
        });
        // const storedSecretInfo = otpSecretMap[email];
        // if (!storedSecretInfo) {
        //   res.status(400).json({ error: 'Invalid or expired OTP' });
        //   return;
        // }
        const mailOptions = {
            from: {
                name: 'QuickGrade App',
                address: 'quickgradedecagon@gmail.com',
            },
            to: email,
            subject: 'Quick Grade App - Reset Password Code',
            text: `TOTP: ${totpToken}`,
            html: ` <h3>Hi there,
Thank you for signing up for QuickGrade. Copy OTP below to reset your password:</h3>
<h1>${totpToken}<h1>
<h3>This OTP will expire in 24 hours. If you did not sign up for a QuickGrade account,
you can safely ignore this email.
Best,
The QuickGrade Team</h3>`,
        };
        yield emailsender_1.transporter.sendMail(mailOptions);
        //     res.status(200).json({ message: 'TOTP sent successfully' });
        //   } catch (error) {
        //     console.error(error);
        //     res.status(500).json({ error: 'Internal Server Error' });
        //   }
        // };
        // Verify OTP
        // const isValidOTP = speakeasy.totp.verify({
        //   secret: storedSecretInfo.secret,
        //   encoding: 'base32',
        //   token: otp,
        //   window: 1, // Allow 1-minute time drift
        // });
        // if (!isValidOTP) {
        //   res.status(400).json({ error: 'Invalid or expired OTP' });
        //   return;
        // }
        // Check OTP expiration time
        // const otpExpirationMinutes = 10;
        // const otpCreationTime = storedSecretInfo.createdAt;
        // const minutesDifference = differenceInMinutes(new Date(), otpCreationTime);
        // if (minutesDifference > otpExpirationMinutes) {
        //   res.status(400).json({ error: 'OTP has expired' });
        //   return;
        // }
        // Reset password (you might want to hash the password before storing it)
        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        // storedSecretInfo.user.password = hashedPassword;
        // await storedSecretInfo.user.save();
        // Remove OTP secret from the map after successful password reset
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete otpSecretMap_1.default[email];
        res.status(200).json({ message: 'OTP for Password reset successful' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.resetPassword = resetPassword;