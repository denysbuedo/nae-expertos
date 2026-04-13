import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all subactivities
router.get('/', async (req: Request, res: Response) => {
  try {
    const { activityId } = req.query;
    
    const where = activityId ? { activityId: activityId as string } : {};
    
    const subactivities = await prisma.subActivity.findMany({
      where,
      include: {
        activity: true,
        deliverables: true,
        assignments: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(subactivities);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching subactivities' });
  }
});

// Get subactivity by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subactivity = await prisma.subActivity.findUnique({
      where: { id },
      include: {
        activity: true,
        deliverables: {
          include: {
            responsible: true,
          },
        },
        assignments: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!subactivity) {
      return res.status(404).json({ error: 'Subactivity not found' });
    }

    res.json(subactivity);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching subactivity' });
  }
});

// Create subactivity
router.post('/', async (req: Request, res: Response) => {
  try {
    const { activityId, number, title, description, status, startDate, endDate } = req.body;

    const subactivity = await prisma.subActivity.create({
      data: {
        activityId,
        number,
        title,
        description,
        status,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json(subactivity);
  } catch (error) {
    res.status(500).json({ error: 'Error creating subactivity' });
  }
});

// Update subactivity
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { number, title, description, status, startDate, endDate } = req.body;

    const subactivity = await prisma.subActivity.update({
      where: { id },
      data: {
        number,
        title,
        description,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.json(subactivity);
  } catch (error) {
    res.status(500).json({ error: 'Error updating subactivity' });
  }
});

// Delete subactivity
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subActivity.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting subactivity' });
  }
});

export default router;
