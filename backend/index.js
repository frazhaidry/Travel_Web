
require("dotenv").config();


const bscrypt = require("bcrypt")
const express = require("express")
const port = 8000
const config = require("./config.json")
const mongoose = require("mongoose")
const upload = require("./multer");
const fs = require("fs");
const path = require("path");

const cors = require("cors")
const jwt = require("jsonwebtoken")
const app = express()       

mongoose.connect(config.connectionString)

const { authenticateToken } = require("./utilities");
const User = require("./models/user.model");
const TravelStory = require("./models/travelStory.model");



app.use(cors({origin: "*"}))
app.use(express.json())

// Create Account
app.post("/create-account", async (req, res) => {
   const {fullName, email, password} = req.body;


   if (!fullName || !email || !password) {
      return res.status(400).json({message: "Please enter all fields"})
   }

   const isUser = await User.findOne({email})
    if (isUser) {
        return res.status(400).json({message: "User already exists"})
    }

    const hashedPassword = await bscrypt.hash(password, 10)

    const user = new User({
        fullName,
        email,
        password: hashedPassword
    })

    await user.save()
   
 
    const accessToken = jwt.sign(
        {userId: user._id},
        process.env.ACCESS_KEY_TOKEN,
        {
            expiresIn: "72hr",
        }
    )
    return res.status(201).json({
        error: false,
        user: {fullName: user.fullName, email: user.email},
        accessToken,
        message: "Registration Successful",
    })
})

// Login
app.get("/login", async (req, res) => {
   const {email, password} = req.body;
   if (!email || !password) {
      return res.status(400).json({message: "Please enter all fields"})
   }

   const user = await User.findOne({
      email
   })
   if(!user){
    return res.status(400).json({message: "User does not exist"})
   }

   const isPasswordValid = await bscrypt.compare(password, user.password)
   if(!isPasswordValid) {
       return res.status(400).json({message: "Invalid Credentials"})
   }

    const accessToken = jwt.sign(
        {userId: user._id},
        process.env.ACCESS_KEY_TOKEN,
        {
            expiresIn: "72hr",
        }
    )

    return res.json({
        error: false,
        message: "Login Successful",
        user: {fullName: user.fullName, email: user.email},
        accessToken,
    })

})

// Get User
app.get("/get-user", authenticateToken, async (req, res) => {
    const {userId} = req.user

    const isUser = await User.findById({_id: userId});

    if(!isUser) {
        return res.status(400).json({message: "User does not exist"})
    }

    return res.json({
        user: isUser,
        message: "hello"
    })
})

// Route to handle image upload
app.post("/image-upload", upload. single("image"), async (req, res) => {
try{
    if(!req.file) {
        return res.status(400).json({message: "Please upload an image"})
    }
     
    const imageUrl = `http://localhost:8000/uploads/${req.file.filename}`;

    res.status(201).json({imageUrl})
} catch (error) {
    return res.status(500).json({error: true, message: error.message})
}
})

// Delete an image from upload folder
app.delete("/delete-image", async (req, res) => {
    const {imageUrl} = req.query;
    if(!imageUrl) {
        return res.status(400).json({error: true , message: "Image URL is required"})
    } 

    try{
        // Extract the filename from the imageUrl
       const filename = path.basename(imageUrl);

       // Define the file path
       const filePath = path.join(__dirname, 'uploads', filename);

       // Check if the file exits
       if(fs.existsSync(filePath)){
        // Delete the file from the uploads folder
        fs.unlinkSync(filePath);
        res.status(200).json({message: "Image deleted successfully"})
       } else{
        res.status(200).json({message: " Image not found"})
       }
    }catch(error){
       res.status(500).json({error: true, message: error.message})
    }
})

// Serve static files from the uploads and assets directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use("/assets", express.static(path.join(__dirname, "assets")))


// Add Travel Story
app.post("/add-travel-story", authenticateToken, async (req, res) => {
    const {title , story , visitedLocation, imageUrl, visitedDate} = req.body;
    const {userId} = req.user

    // Validate required Fields
    if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
        return res.status(400).json({message: "Please enter all fields"})
    }

    // Convert visitedDate from milliseconds to date object
    const parsedVisitedDate = new Date(parseInt(visitedDate));

    try{
        const travelStory = new TravelStory({
            title,
            story,
            visitedLocation,
            userId,
            imageUrl,
            visitedDate:parsedVisitedDate,
        })
        await travelStory.save();
        res.status(201).json({story : travelStory, message: "Travel Story added successfully"})
    } catch (error) {
        return res.status(400).json({error: true, message: error.message})
    }
})

// Get All Travel Stories 
app.get("/get-all-stories", authenticateToken, async (req, res) => {
   const {userId} = req.user;

   try{
         const travelStories = await TravelStory.find({userId}).sort({isFavourite: -1})
         return res.json({stories: travelStories})
   } catch (error) {
       return res.status(500).json({error: true, message: error.message})
   }

})

// Edit Travel Story
app.put("/edit-story/:id", authenticateToken, async( req, res) => {
    const { id } = req.params;
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { userId } = req.user;

    // Validate required Fields
    if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
        return res.status(400).json({message: "Please enter all fields"})
    }

    // Convert visitedDate from milliseconds to date object
    const parsedVisitedDate = new Date(parseInt(visitedDate));

    try {
       // Find the travel story by ID and ensure it belongs to the authenticated user
       const travelStory = await TravelStory.findOne({_id: id, userId: userId});

       if(!travelStory){
        return res.status(404).json({error: true, message: "Travel Story not found"})
       }

       const placeholderImgUrl = `http://localhost:8000/assets/image.png`;   

       travelStory.title = title;
       travelStory.story = story;
       travelStory.visitedLocation = visitedLocation;
       travelStory.imageUrl = imageUrl || placeholderImgUrl;
       travelStory.visitedDate = parsedVisitedDate;

       await travelStory.save();
       return res.json({story: travelStory, message: "Travel Story updated successfully"})


    } catch(error){ 
        res.status(500).json({error: true, message: error.message})
    }

})

// Delete a Travel Story
app.delete("/delete-story/:id", authenticateToken, async (req, res) => {
    const {id} = req.params;
    const {userId} = req.user;

    try{
        // Find the travel story by ID and ensure it belongs to the authenticated user
        const travelStory = await TravelStory.findOne({_id: id, userId: userId});

        if(!travelStory){
           return res.status(404).json({error: true, message: "Travel story not found"});
        }


        // Delete the travel story from the database
        await travelStory.deleteOne({ _id: id, userId: userId});

        // Extract the finename from the imageURL
        const imageUrl = travelStory.imageUrl;
        const filename = path.basename(imageUrl);

        // Define the fine path
        const filePath = path.join(__dirname, "uploads", filename);

        // Delete the image file from the uploads folder 
        fs.unlinkSync(filePath, (error) => {
            if(err){
                console.error("Failed to delete image file", err);
                // Optionally, you could still respond with a success status here
                // if you don't want to treat this as a critical error

            }
        });

        res.status(200).json({message: "Travel Story deleted successfully"});

    }catch(error){
        res.status(500).json({error: true, message: error.message})
    }
})


// Update IsFavourite
app.put("/update-is-favourite/:id", authenticateToken, async (req, res) => {
    const { id} = req.params;
    const {isFavourite} = req.body;
    const {userId} = req.user;

    try{
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId});

        if(!travelStory){
            return res.status(404).json({error: true, message: "Travel Story not found"})
        }

        travelStory.isFavourite = isFavourite;

        await travelStory.save();

        res.status(200).json({story: travelStory, message: "Updated Successfully"})
       
        
    }catch(error){
        res.status(500).json({error: true, message: error.message})
    }
})

//Search Travel Story
app.get("/search", authenticateToken, async (req, res) => { 
    const { userId } = req.user;
    const { query } = req.query;
    
    if(!query){
        return res.status(404).json({error: true, message: "Please enter a search query"})
    }

    try{

        const searchResults = await TravelStory.find({
            userId: userId,
            $or: [
                { title: { $regex: query, $options: "i" } },
                { story: { $regex: query, $options: "i"}},
                { visitedLocation: { $regex: query, $options: "i"}},

            ],
        }).sort({isFavourite: -1});

        res.status(200).json({stories: searchResults})

    } catch(error){
        res.status(500).json({error: true, message: error.message})
  }
})





app.listen(port)
module.exports = app;