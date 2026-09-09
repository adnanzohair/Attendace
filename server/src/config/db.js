import mongoose from 'mongoose';

mongoose.set('bufferCommands',false);

export async function connectDatabase(){
  const connection=await mongoose.connect(process.env.MONGODB_URI,{
    serverSelectionTimeoutMS:30000,
    connectTimeoutMS:30000,
    socketTimeoutMS:45000,
    maxPoolSize:5,
    retryWrites:false,
    w:'majority',
  });
  console.log(`Connected to MongoDB: ${connection.connection.name}`);
  return connection;
}
