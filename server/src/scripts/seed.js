import '../config/env.js';
import bcrypt from 'bcryptjs';
import {connectDatabase} from '../config/db.js';
import {Settings,User} from '../models/index.js';

try {
  await connectDatabase();
  if(!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD)throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  await User.updateOne(
    {email:process.env.ADMIN_EMAIL.toLowerCase()},
    {$set:{name:'Administrator',email:process.env.ADMIN_EMAIL.toLowerCase(),passwordHash:await bcrypt.hash(process.env.ADMIN_PASSWORD,12),role:'owner',active:true,accountState:'active'}},
    {upsert:true}
  );
  await Settings.updateOne({key:'global'},{$setOnInsert:{key:'global'}},{upsert:true});
  console.log('Bootstrap complete');
  process.exit(0);
} catch(error) {
  console.error('Bootstrap failed:',error.message);
  process.exit(1);
}
