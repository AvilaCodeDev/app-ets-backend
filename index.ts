
import express  from 'express';
import dotenv from 'dotenv';
import { Server } from './src/controllers/server';

dotenv.config({ path: '.env'});

const server = new Server();
server.listen();