
import Lecturer from '../model/lecturerModel';
import express, { Request, Response, NextFunction} from 'express';
import bcyrpt from 'bcryptjs';



export const lecturerSignup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const { faculty, department, password, email } = req.body;
    const existingLecturer = await Lecturer.findOne({ where: { email } });

    if (existingLecturer) {
      return res.status(400).json({
        message: "Lecturer already exists",
      });
    }
    const hashedPassword = await bcyrpt.hash(password, 12);
    
    const createdLecturer = await Lecturer.create({
      faculty,
      department,
      password: hashedPassword,
      email,
     
    });
    
    if (!createdLecturer) {
      console.error("Lecturer signup failed: Lecturer not created");
      return res.status(400).json({
        message: "Lecturer signup failed",
      });
    }

    

    return res.status(200).json({
      lecturerId: createdLecturer, // Update the property name to 'id'
      message: "Lecturer signup successful",
    });
  } catch (error) {
    console.error("Error creating lecturer:", error);

    return res.status(500).json({
      message: ` error: ${error}`,
    });
  }
};



export const lecturerLogin = async (req: Request, res: Response, next: NextFunction) => {
  const { lecturerId, password } = req.body;
 
  
  try {
   
    const existingLecturer = await Lecturer.findOne({ where: { lecturerId } });

    if (!existingLecturer) {
      return res.status(400).json({
        message: "Invalid lecturerId",
      });
    }

    const isPasswordValid = await bcyrpt.compare(password, existingLecturer.dataValues.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }


    return res.status(200).json({
      lecturerId: existingLecturer.dataValues.id,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error during lecturer login:", error);

    return res.status(500).json({
      message: `Error: ${error}`,
    });
  }
};



export const updateLecturerPassword = async (req: Request, res: Response) => {

    const { userId } = req.params;
    const { newPassword } = req.body;
  
    try {
      // Find the user by ID
      const user = await Lecturer.findByPk(userId);
  
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

