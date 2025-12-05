require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Company = require('../models/Company');
const Ticket = require('../models/Ticket');
const Message = require('../models/Message');

connectDB();

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Company.deleteMany();
    await Ticket.deleteMany();
    await Message.deleteMany();

    console.log('Data cleared...');

    // Create companies
    const companies = await Company.create([
      {
        name: 'Tech Corp',
        email: 'info@techcorp.com',
        phone: '+1234567890',
        industry: 'Technology',
        size: 'large',
      },
      {
        name: 'Design Studio',
        email: 'hello@designstudio.com',
        phone: '+0987654321',
        industry: 'Design',
        size: 'medium',
      },
    ]);

    console.log('Companies created...');

    // Create users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        company: companies[0]._id,
      },
      {
        name: 'Agent Smith',
        email: 'agent@example.com',
        password: 'agent123',
        role: 'agent',
        company: companies[0]._id,
      },
      {
        name: 'John Customer',
        email: 'customer@example.com',
        password: 'customer123',
        role: 'customer',
        company: companies[0]._id,
      },
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'jane123',
        role: 'customer',
        company: companies[1]._id,
      },
    ]);

    console.log('Users created...');

    // Create tickets
    const tickets = await Ticket.create([
      {
        title: 'Login Issue',
        description: 'Cannot login to my account',
        status: 'open',
        priority: 'high',
        category: 'technical',
        customer: users[2]._id,
        assignedTo: users[1]._id,
        company: companies[0]._id,
      },
      {
        title: 'Feature Request',
        description: 'Would like dark mode option',
        status: 'in-progress',
        priority: 'medium',
        category: 'feature-request',
        customer: users[2]._id,
        assignedTo: users[1]._id,
        company: companies[0]._id,
      },
      {
        title: 'Billing Question',
        description: 'Question about my last invoice',
        status: 'resolved',
        priority: 'low',
        category: 'billing',
        customer: users[3]._id,
        company: companies[1]._id,
        resolvedAt: new Date(),
      },
      {
        title: 'Bug Report',
        description: 'Button not working on mobile',
        status: 'open',
        priority: 'urgent',
        category: 'bug',
        customer: users[2]._id,
        company: companies[0]._id,
      },
    ]);

    console.log('Tickets created...');

    // Create messages
    await Message.create([
      {
        ticket: tickets[0]._id,
        sender: users[2]._id,
        message: 'Hi, I am unable to login to my account. Please help.',
      },
      {
        ticket: tickets[0]._id,
        sender: users[1]._id,
        message: 'Hello! I am looking into this issue. Can you provide your username?',
      },
      {
        ticket: tickets[1]._id,
        sender: users[2]._id,
        message: 'It would be great to have a dark mode for night usage.',
      },
      {
        ticket: tickets[1]._id,
        sender: users[1]._id,
        message: 'Thank you for the suggestion! We are working on this feature.',
      },
    ]);

    console.log('Messages created...');

    console.log('✅ Seed data created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Agent: agent@example.com / agent123');
    console.log('Customer: customer@example.com / customer123');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
