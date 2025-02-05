import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
//import { authMiddleware, agentRoleMiddleware } from '../middlewares/authMiddleware.js';
import { authMiddleware, agentRoleMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/send', authMiddleware, agentRoleMiddleware, async (req, res) => {
  const { receiverId, applicationId, content } = req.body;
  const senderId = req.user.id;

  try {
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    if (req.user.role !== 'agent') {
      return res.status(403).json({ message: 'Only agents can send messages' });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      application: applicationId,
      content,
    });

    await message.save();

    return res.status(201).json({ message: 'Message sent successfully', message });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

router.get('/received', authMiddleware, async (req, res) => {
  const agentId = req.user.id;

  try {
    const messages = await Message.find({ receiver: agentId })
      .populate('sender', 'email role')
      .populate('application', 'job')
      .sort({ sentAt: -1 });

    if (messages.length === 0) {
      return res.status(404).json({ message: 'No messages found for this agent.' });
    }

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return res.status(500).json({ message: 'Error retrieving messages', error: error.message });
  }
});

router.get('/sent', authMiddleware, async (req, res) => {
  const applicantId = req.user.id;

  try {
    const messages = await Message.find({ sender: applicantId })
      .populate('receiver', 'email role')
      .populate('application', 'job')
      .sort({ sentAt: -1 });

    if (messages.length === 0) {
      return res.status(404).json({ message: 'No messages found for this applicant.' });
    }

    return res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error retrieving messages', error: error.message });
  }
});

router.put('/mark-read/:messageId', async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findByIdAndUpdate(messageId, { isRead: true }, { new: true });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ message: 'Message marked as read', message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error marking message as read', error });
  }
});

export default router;
