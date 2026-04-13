import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all deliverable assignments
router.get('/', async (req: Request, res: Response) => {
  try {
    const { expertId, deliverableId } = req.query;
    const where: any = {};
    if (expertId) where.expertId = expertId as string;
    if (deliverableId) where.deliverableId = deliverableId as string;

    const assignments = await prisma.deliverableAssignment.findMany({
      where,
      include: {
        expert: {
          include: {
            profiles: { include: { profile: true } },
          },
        },
        deliverable: true,
      },
      orderBy: { assignedAt: 'desc' },
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching deliverable assignments' });
  }
});

// Get assignments for a specific expert (for work plan report)
router.get('/expert/:expertId', async (req: Request, res: Response) => {
  try {
    const { expertId } = req.params;

    const assignments = await prisma.deliverableAssignment.findMany({
      where: { expertId },
      include: {
        expert: true,
        deliverable: {
          include: {
            subActivity: {
              include: {
                activity: true,
              },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const expert = await prisma.expertPool.findUnique({
      where: { id: expertId },
      include: {
        profiles: { include: { profile: true } },
      },
    });

    res.json({ expert, assignments });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching expert work plan' });
  }
});

// Create assignment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { expertId, deliverableId, isResponsible, role } = req.body;

    // If marking as responsible, unset other responsibles for this deliverable
    if (isResponsible) {
      await prisma.deliverableAssignment.updateMany({
        where: { deliverableId, isResponsible: true },
        data: { isResponsible: false },
      });
    }

    const assignment = await prisma.deliverableAssignment.create({
      data: {
        expertId,
        deliverableId,
        isResponsible,
        role,
      },
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Esta persona ya está asignada a este entregable' });
    }
    res.status(500).json({ error: 'Error creating assignment' });
  }
});

// Update assignment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isResponsible, role } = req.body;

    // If marking as responsible, unset others
    if (isResponsible) {
      const existing = await prisma.deliverableAssignment.findUnique({ where: { id } });
      if (existing) {
        await prisma.deliverableAssignment.updateMany({
          where: { deliverableId: existing.deliverableId, isResponsible: true, id: { not: id } },
          data: { isResponsible: false },
        });
      }
    }

    const assignment = await prisma.deliverableAssignment.update({
      where: { id },
      data: { isResponsible, role },
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
    await prisma.deliverableAssignment.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting assignment' });
  }
});

export default router;
