
console.log('1. Start');
import 'dotenv/config';
console.log('2. Dotenv loaded');
import mysql from 'mysql2/promise';
console.log('3. MySQL loaded');
import sharp from 'sharp';
console.log('4. Sharp loaded');
import { uploadCompanyLogoSecure } from '../services/ImageUploadService.js';
console.log('5. Service loaded');
console.log('Done');
