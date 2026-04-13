import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all deliverables
router.get('/', async (req: Request, res: Response) => {
  try {
    const { subActivityId } = req.query;
    const where: any = {};
    if (subActivityId) where.subActivityId = subActivityId as string;

    const deliverables = await prisma.deliverable.findMany({
      where,
      include: {
        subActivity: true,
        assignments: {
          include: {
            expert: {
              include: {
                profiles: { include: { profile: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(deliverables);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching deliverables' });
  }
});

// Get deliverable by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deliverable = await prisma.deliverable.findUnique({
      where: { id },
      include: {
        subActivity: true,
        assignments: {
          include: {
            expert: {
              include: {
                profiles: { include: { profile: true } },
              },
            },
          },
        },
      },
    });

    if (!deliverable) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    res.json(deliverable);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching deliverable' });
  }
});

// Create deliverable
router.post('/', async (req: Request, res: Response) => {
  try {
    const { subActivityId, title, description, status, dueDate, deliveryDate, fileUrl } = req.body;

    const deliverable = await prisma.deliverable.create({
      data: {
        subActivityId,
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        fileUrl,
      },
    });

    res.status(201).json(deliverable);
  } catch (error) {
    res.status(500).json({ error: 'Error creating deliverable' });
  }
});

// Update deliverable
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subActivityId, title, description, status, dueDate, deliveryDate, fileUrl } = req.body;

    const deliverable = await prisma.deliverable.update({
      where: { id },
      data: {
        subActivityId,
        title,
        description,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        fileUrl,
      },
    });

    res.json(deliverable);
  } catch (error) {
    res.status(500).json({ error: 'Error updating deliverable' });
  }
});

// Delete deliverable
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.deliverable.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting deliverable' });
  }
});

export default router;
