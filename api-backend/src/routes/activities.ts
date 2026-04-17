import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all activities
router.get('/', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.query;
    
    const where = orderId ? { orderId: orderId as string } : {};
    
    const activities = await prisma.activity.findMany({
      where,
      include: {
        order: true,
        subactivities: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching activities' });
  }
});

// Get activity by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        order: true,
        subactivities: {
          include: {
            deliverables: true,
            assignments: {
              include: {
                expert: true,
              },
            },
          },
        },
      },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching activity' });
  }
});

// Create activity
router.post('/', async (req: Request, res: Response) => {
  try {
    const { orderId, number, title, description, status, startDate, endDate } = req.body;

    const activity = await prisma.activity.create({
      data: {
        orderId,
        number,
        title,
        description,
        status,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Error creating activity' });
  }
});

// Update activity
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { number, title, description, status, startDate, endDate } = req.body;

    const activity = await prisma.activity.update({
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

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Error updating activity' });
  }
});

// Delete activity
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.activity.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting activity' });
  }
});

export default router;
