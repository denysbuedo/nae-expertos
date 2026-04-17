import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    const { expertPoolId, subActivityId } = req.query;
    
    const where: any = {};
    if (expertPoolId) where.expertPoolId = expertPoolId as string;
    if (subActivityId) where.subActivityId = subActivityId as string;
    
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        expert: true,
        subActivity: {
          include: {
            activity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching assignments' });
  }
});

// Get assignment by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        expert: true,
        subActivity: {
          include: {
            activity: true,
          },
        },
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching assignment' });
  }
});

// Create assignment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { expertPoolId, subActivityId, role } = req.body;

    const assignment = await prisma.assignment.create({
      data: {
        expertPoolId,
        subActivityId,
        role,
      },
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Assignment already exists' });
    }
    res.status(500).json({ error: 'Error creating assignment' });
  }
});

// Update assignment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        role,
      },
    });

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Error updating assignment' });
  }
});

// Delete assignment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.assignment.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting assignment' });
  }
});

export default router;
