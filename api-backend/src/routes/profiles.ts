import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all profiles
router.get('/', async (req: Request, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany({
      orderBy: { name: 'asc' },
    });
    
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profiles' });
  }
});

// Get profile by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const profile = await prisma.profile.findUnique({
      where: { id },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Create profile
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    const profile = await prisma.profile.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Error creating profile' });
  }
});

// Update profile
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const profile = await prisma.profile.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Delete profile
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.profile.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting profile' });
  }
});

export default router;
