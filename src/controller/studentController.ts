import Student from '../model/studentModel';
import express, { Request, Response, NextFunction} from 'express';
import Lecturer from '../model/lecturerModel';
import bcrypt from 'bcryptjs';
//import StudentModel from '../model/studentModel'; // Import the missing StudentModel


export const studentSignup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("req", req.body)
    const { faculty, email, department, password} = req.body;

    const existingStudent = await Student.findOne({ where: { email } });

    if (existingStudent) {
      return res.status(400).json({
        message: "Student already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
console.log("password", hashedPassword)
    const createdStudent = await Student.create({
      faculty,
      department,
      email,
      password: hashedPassword,
    });

    if (!createdStudent) {
        return res.status(400).json({
            message: "Student signup failed",
        });
    }
return res.status(200).json({studentDetail: createdStudent});
    
  }catch (error) {
    console.error("Error creating student: ", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}






export const studentLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { studentId, password } = req.body;
  try {
    
    const existingStudent = await Student.findOne({ where: { studentId } });

    if (!existingStudent) {
      return res.status(404).json({
        message: "Student not found",
      });
    }
 
    const isPasswordValid = await bcrypt.compare(password, existingStudent.dataValues.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    return res.status(200).json({
      studentDetail: existingStudent,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error during student login:", error);

    return res.status(500).json({
      message: `Error: ${error}`,
    });
  }
};





export const updateStudentPassword = async (req: Request, res: Response) => {

    const { userId } = req.params;
    const { newPassword } = req.body;
  
    try {
      // Find the user by ID
      const user = await Student.findByPk(userId);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Update the user's password
      user.dataValues.password = newPassword
  
      // Save the updated user to the database
      await user.save();
  
      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }


}