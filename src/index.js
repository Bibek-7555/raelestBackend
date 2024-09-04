import dotenv from 'dotenv'
import connectDB from './db/index.js'
import { app } from './app.js';


dotenv.config({
    path: './.env'
})

const port = process.env.PORT || 8800;

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8800, () => {
        console.log(`Server is running at port : ${port}`)
    })

})
.catch((err) => {
    console.log("MongodB connection failed")
})
